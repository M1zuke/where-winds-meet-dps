import type { WorkerRequest, WorkerResponse } from "../../engine/dpsWorker"
import DpsWorker from "../../engine/dpsWorker?worker"
import { debounceMsFor } from "./workerDebounce"
import { cacheResponse, cachedResponse, requestSignature } from "./workerResultCache"
import { mergeShardResponses, shardRequest } from "./workerShards"

type RequestKind = WorkerRequest["kind"]
type ResponseKind = WorkerResponse["kind"]
type ResultKind = Extract<RequestKind, ResponseKind>
type ResponseOfKind<K extends ResultKind> = Extract<WorkerResponse, { kind: K }>
type ResponseListener = (response: WorkerResponse) => void

type WithoutReqId<Request> = Request extends unknown ? Omit<Request, "reqId"> : never
export type UnsentRequest = WithoutReqId<WorkerRequest>

export type ProgressResponse = Extract<WorkerResponse, { kind: "parseSimulationProgress" }>
type ProgressListener = (progress: ProgressResponse) => void

const MAX_POOL_SIZE = 4

const PROGRESS_OWNER_KIND: Partial<Record<ResponseKind, RequestKind>> = {
  parseSimulationProgress: "parseSimulation",
}
const CANCEL_KIND_BY_KIND: Partial<Record<RequestKind, RequestKind>> = {
  parseSimulation: "parseSimulationCancel",
}
const SELF_REPORTING_KINDS = new Set<RequestKind>(Object.values(PROGRESS_OWNER_KIND))

export interface DpsWorkerActivity {
  kinds: readonly RequestKind[]
  done: number
  total: number
}

interface ShardCollector {
  remaining: number
  parts: WorkerResponse[]
}

interface KindState {
  responseListeners: Set<ResponseListener>
  pendingListeners: Set<() => void>
  progressListeners: Set<ProgressListener>
  queued: WorkerRequest | null
  queuedSignature: string | null
  debounceHandle: ReturnType<typeof setTimeout> | null
  latestReqId: number
  lastDeliveredReqId: number
  isPending: boolean
  retained: WorkerResponse | null
  retainedReqId: number
  signatureByInFlightReqId: Map<number, string>
  awaitedReqId: number | null
}

const stateByKind = new Map<RequestKind, KindState>()
const pool: Worker[] = []
const inFlightByWorker = new Map<Worker, number>()
const workerByReqId = new Map<number, Worker>()
const ownerReqIdByShardReqId = new Map<number, number>()
const collectorByReqId = new Map<number, ShardCollector>()
const activityListeners = new Set<() => void>()
let activity: DpsWorkerActivity = { kinds: [], done: 0, total: 0 }
let lastAssignedReqId = 0

function stateFor(kind: RequestKind): KindState {
  const existing = stateByKind.get(kind)
  if (existing) return existing
  const created: KindState = {
    responseListeners: new Set(),
    pendingListeners: new Set(),
    progressListeners: new Set(),
    queued: null,
    queuedSignature: null,
    debounceHandle: null,
    latestReqId: -1,
    lastDeliveredReqId: -1,
    isPending: false,
    retained: null,
    retainedReqId: -1,
    signatureByInFlightReqId: new Map(),
    awaitedReqId: null,
  }
  stateByKind.set(kind, created)
  return created
}

function poolSize(): number {
  const cores = navigator.hardwareConcurrency || MAX_POOL_SIZE
  return Math.max(1, Math.min(MAX_POOL_SIZE, cores - 1))
}

function inFlightOn(worker: Worker): number {
  return inFlightByWorker.get(worker) ?? 0
}

function freestWorker(): Worker {
  const idle = pool.find((worker) => inFlightOn(worker) === 0)
  if (idle) return idle
  if (pool.length < poolSize()) {
    const worker = new DpsWorker()
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => receive(event.data)
    pool.push(worker)
    return worker
  }
  return pool.reduce((freest, worker) =>
    inFlightOn(worker) < inFlightOn(freest) ? worker : freest,
  )
}

function claimWorker(reqId: number): Worker {
  const worker = freestWorker()
  workerByReqId.set(reqId, worker)
  inFlightByWorker.set(worker, inFlightOn(worker) + 1)
  return worker
}

function releaseWorker(reqId: number): void {
  const worker = workerByReqId.get(reqId)
  if (!worker) return
  workerByReqId.delete(reqId)
  inFlightByWorker.set(worker, Math.max(0, inFlightOn(worker) - 1))
}

function setPending(state: KindState, isPending: boolean): void {
  if (state.isPending === isPending) return
  state.isPending = isPending
  for (const listener of state.pendingListeners) listener()
  refreshActivity()
}

function refreshActivity(): void {
  const kinds: RequestKind[] = []
  for (const [kind, state] of stateByKind) {
    if (state.isPending && !SELF_REPORTING_KINDS.has(kind)) kinds.push(kind)
  }
  const started = new Set(kinds)
  const wasPending = new Set(activity.kinds)
  const opened = kinds.filter((kind) => !wasPending.has(kind)).length
  const closed = activity.kinds.filter((kind) => !started.has(kind)).length
  if (opened === 0 && closed === 0) return
  activity =
    kinds.length === 0
      ? { kinds, done: 0, total: 0 }
      : { kinds, done: activity.done + closed, total: activity.total + opened }
  for (const listener of activityListeners) listener()
}

function receive(response: WorkerResponse): void {
  const owner = PROGRESS_OWNER_KIND[response.kind]
  if (owner) deliverProgress(owner, response as ProgressResponse)
  else if (!collectShard(response)) deliver(response)
}

function deliverProgress(kind: RequestKind, progress: ProgressResponse): void {
  const state = stateFor(kind)
  if (progress.reqId !== state.latestReqId) return
  for (const listener of state.progressListeners) listener(progress)
}

function deliver(response: WorkerResponse): void {
  const kind = response.kind as RequestKind
  const state = stateFor(kind)
  releaseWorker(response.reqId)
  const signature = state.signatureByInFlightReqId.get(response.reqId)
  if (signature !== undefined) {
    state.signatureByInFlightReqId.delete(response.reqId)
    cacheResponse(kind, signature, response)
  }
  const answered = awaitedAnswer(state, response)
  if (answered.reqId === state.latestReqId) setPending(state, false)
  if (answered.reqId > state.retainedReqId) {
    state.retainedReqId = answered.reqId
    state.retained = answered
  }
  if (answered.reqId <= state.lastDeliveredReqId) return
  state.lastDeliveredReqId = answered.reqId
  for (const listener of state.responseListeners) listener(answered)
}

function awaitedAnswer(state: KindState, response: WorkerResponse): WorkerResponse {
  if (state.awaitedReqId !== response.reqId) return response
  state.awaitedReqId = null
  return { ...response, reqId: state.latestReqId } as WorkerResponse
}

function reqIdAlreadyComputing(state: KindState, signature: string): number | null {
  for (const [reqId, inFlightSignature] of state.signatureByInFlightReqId) {
    if (inFlightSignature === signature) return reqId
  }
  return null
}

function postCancel(kind: RequestKind, state: KindState): void {
  const cancelKind = CANCEL_KIND_BY_KIND[kind]
  if (!cancelKind) return
  if (state.latestReqId <= state.lastDeliveredReqId) return
  const running = workerByReqId.get(state.latestReqId)
  if (!running) return
  running.postMessage({ kind: cancelKind, reqId: state.latestReqId })
}

function dropQueued(state: KindState): void {
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = null
  state.queued = null
  state.queuedSignature = null
}

function sendQueued(state: KindState): void {
  const request = state.queued
  const signature = state.queuedSignature
  state.queued = null
  state.queuedSignature = null
  if (!request) return
  if (signature !== null) state.signatureByInFlightReqId.set(request.reqId, signature)
  const shards = shardRequest(request, poolSize())
  if (!shards) {
    claimWorker(request.reqId).postMessage(request)
    return
  }
  const collector: ShardCollector = { remaining: shards.length, parts: [] }
  collectorByReqId.set(request.reqId, collector)
  for (const shard of shards) {
    const shardReqId = ++lastAssignedReqId
    ownerReqIdByShardReqId.set(shardReqId, request.reqId)
    const sent = { ...shard, reqId: shardReqId } as WorkerRequest
    claimWorker(shardReqId).postMessage(sent)
  }
}

function collectShard(response: WorkerResponse): boolean {
  const ownerReqId = ownerReqIdByShardReqId.get(response.reqId)
  if (ownerReqId === undefined) return false
  ownerReqIdByShardReqId.delete(response.reqId)
  releaseWorker(response.reqId)
  const collector = collectorByReqId.get(ownerReqId)
  if (!collector) return true
  collector.parts.push(response)
  collector.remaining--
  if (collector.remaining > 0) return true
  collectorByReqId.delete(ownerReqId)
  deliver({ ...mergeShardResponses(collector.parts), reqId: ownerReqId } as WorkerResponse)
  return true
}

function abandonRequests(kind: RequestKind, state: KindState): void {
  postCancel(kind, state)
  dropQueued(state)
  state.awaitedReqId = null
  state.lastDeliveredReqId = state.latestReqId
  setPending(state, false)
}

export function postToDpsWorker(unsent: UnsentRequest): void {
  const request = { ...unsent, reqId: ++lastAssignedReqId } as WorkerRequest
  const state = stateFor(request.kind)
  postCancel(request.kind, state)
  dropQueued(state)
  state.latestReqId = request.reqId
  state.awaitedReqId = null

  const signature = requestSignature(request)
  if (signature !== null) {
    const cached = cachedResponse(request.kind, signature)
    if (cached) {
      const replay = { ...cached, reqId: request.reqId } as WorkerResponse
      queueMicrotask(() => deliver(replay))
      return
    }
    const alreadyComputing = reqIdAlreadyComputing(state, signature)
    if (alreadyComputing !== null) {
      state.awaitedReqId = alreadyComputing
      setPending(state, true)
      return
    }
  }

  state.queued = request
  state.queuedSignature = signature
  setPending(state, true)
  const delayMs = debounceMsFor(request.kind)
  if (delayMs <= 0) {
    sendQueued(state)
    return
  }
  state.debounceHandle = setTimeout(() => {
    state.debounceHandle = null
    sendQueued(state)
  }, delayMs)
}

export function cancelDpsWorkerRequest(kind: RequestKind): void {
  const state = stateFor(kind)
  dropQueued(state)
  postCancel(kind, state)
}

export function retainedResponse<K extends ResultKind>(kind: K): ResponseOfKind<K> | null {
  return (stateFor(kind).retained as ResponseOfKind<K> | null) ?? null
}

export function subscribeToDpsWorker<K extends ResultKind>(
  kind: K,
  listener: (response: ResponseOfKind<K>) => void,
): () => void {
  const state = stateFor(kind)
  const typedListener = listener as ResponseListener
  state.responseListeners.add(typedListener)
  return () => {
    state.responseListeners.delete(typedListener)
    if (state.responseListeners.size === 0) abandonRequests(kind, state)
  }
}

export function subscribeToDpsWorkerProgress(
  kind: RequestKind,
  listener: ProgressListener,
): () => void {
  const state = stateFor(kind)
  state.progressListeners.add(listener)
  return () => {
    state.progressListeners.delete(listener)
  }
}

export function subscribeToDpsWorkerPending(kind: RequestKind, listener: () => void): () => void {
  const state = stateFor(kind)
  state.pendingListeners.add(listener)
  return () => {
    state.pendingListeners.delete(listener)
  }
}

export function isDpsWorkerPending(kind: RequestKind): boolean {
  return stateFor(kind).isPending
}

export function dpsWorkerActivity(): DpsWorkerActivity {
  return activity
}

export function subscribeToDpsWorkerActivity(listener: () => void): () => void {
  activityListeners.add(listener)
  return () => {
    activityListeners.delete(listener)
  }
}
