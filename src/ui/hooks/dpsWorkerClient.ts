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
  progressByShardReqId: Map<number, { done: number; total: number }>
}

interface DispatchUnit {
  request: WorkerRequest
  kind: RequestKind
  ownerReqId: number
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
const waitingUnits: DispatchUnit[] = []
const runningUnitByWorker = new Map<Worker, DispatchUnit>()
const workerByReqId = new Map<number, Worker>()
const ownerReqIdByShardReqId = new Map<number, { ownerReqId: number; shardPosition: number }>()
const collectorByReqId = new Map<number, ShardCollector>()
const cancelledOwnerReqIds = new Set<number>()
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

function spawnWorker(): Worker {
  const worker = new DpsWorker()
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (pool.includes(worker)) receive(event.data)
  }
  pool.push(worker)
  return worker
}

function idleWorker(): Worker | null {
  const idle = pool.find((worker) => !runningUnitByWorker.has(worker))
  if (idle) return idle
  return pool.length < poolSize() ? spawnWorker() : null
}

function dispatchWaiting(): void {
  while (waitingUnits.length > 0) {
    const worker = idleWorker()
    if (!worker) return
    const unit = waitingUnits.shift() as DispatchUnit
    runningUnitByWorker.set(worker, unit)
    workerByReqId.set(unit.request.reqId, worker)
    worker.postMessage(unit.request)
    if (unit.request.kind === "parseSimulation" && cancelledOwnerReqIds.has(unit.ownerReqId)) {
      worker.postMessage({ kind: "parseSimulationCancel", reqId: unit.request.reqId })
    }
  }
}

function finishUnit(reqId: number): void {
  const worker = workerByReqId.get(reqId)
  if (worker) {
    workerByReqId.delete(reqId)
    runningUnitByWorker.delete(worker)
  }
  dispatchWaiting()
}

function terminateUnit(reqId: number): void {
  const worker = workerByReqId.get(reqId)
  if (!worker) return
  workerByReqId.delete(reqId)
  runningUnitByWorker.delete(worker)
  worker.onmessage = null
  worker.terminate()
  pool.splice(pool.indexOf(worker), 1)
  dispatchWaiting()
}

function stopRunsOf(kind: RequestKind, state: KindState, keptOwnerReqId: number | null): void {
  const stoppedOwners = new Set<number>()
  for (let at = waitingUnits.length - 1; at >= 0; at--) {
    const unit = waitingUnits[at]
    if (unit.kind !== kind || unit.ownerReqId === keptOwnerReqId) continue
    waitingUnits.splice(at, 1)
    stoppedOwners.add(unit.ownerReqId)
  }
  for (const unit of [...runningUnitByWorker.values()]) {
    if (unit.kind !== kind || unit.ownerReqId === keptOwnerReqId) continue
    stoppedOwners.add(unit.ownerReqId)
    terminateUnit(unit.request.reqId)
  }
  for (const ownerReqId of stoppedOwners) {
    state.signatureByInFlightReqId.delete(ownerReqId)
    collectorByReqId.delete(ownerReqId)
    cancelledOwnerReqIds.delete(ownerReqId)
    for (const [shardReqId, shard] of ownerReqIdByShardReqId) {
      if (shard.ownerReqId === ownerReqId) ownerReqIdByShardReqId.delete(shardReqId)
    }
  }
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
  if (owner) deliverProgress(owner, shardedProgress(response as ProgressResponse))
  else if (!collectShard(response)) deliver(response)
}

function shardedProgress(progress: ProgressResponse): ProgressResponse {
  const shard = ownerReqIdByShardReqId.get(progress.reqId)
  const collector = shard && collectorByReqId.get(shard.ownerReqId)
  if (!shard || !collector) return progress
  collector.progressByShardReqId.set(progress.reqId, {
    done: progress.done,
    total: progress.total,
  })
  let done = 0
  let total = 0
  for (const part of collector.progressByShardReqId.values()) {
    done += part.done
    total += part.total
  }
  return { ...progress, reqId: shard.ownerReqId, done, total }
}

function deliverProgress(kind: RequestKind, progress: ProgressResponse): void {
  const state = stateFor(kind)
  if (progress.reqId !== state.latestReqId) return
  for (const listener of state.progressListeners) listener(progress)
}

function deliver(response: WorkerResponse): void {
  const kind = response.kind as RequestKind
  const state = stateFor(kind)
  cancelledOwnerReqIds.delete(response.reqId)
  finishUnit(response.reqId)
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
  const shardReqIds = [...ownerReqIdByShardReqId]
    .filter(([, shard]) => shard.ownerReqId === state.latestReqId)
    .map(([shardReqId]) => shardReqId)
  cancelledOwnerReqIds.add(state.latestReqId)
  for (const reqId of shardReqIds.length > 0 ? shardReqIds : [state.latestReqId]) {
    workerByReqId.get(reqId)?.postMessage({ kind: cancelKind, reqId })
  }
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
    waitingUnits.push({ request, kind: request.kind, ownerReqId: request.reqId })
    dispatchWaiting()
    return
  }
  const collector: ShardCollector = {
    remaining: shards.length,
    parts: [],
    progressByShardReqId: new Map(),
  }
  collectorByReqId.set(request.reqId, collector)
  shards.forEach((shard, shardPosition) => {
    const shardReqId = ++lastAssignedReqId
    ownerReqIdByShardReqId.set(shardReqId, { ownerReqId: request.reqId, shardPosition })
    if (shard.kind === "parseSimulation" && shard.runRange) {
      collector.progressByShardReqId.set(shardReqId, {
        done: 0,
        total: shard.runRange.end - shard.runRange.start,
      })
    }
    waitingUnits.push({
      request: { ...shard, reqId: shardReqId } as WorkerRequest,
      kind: request.kind,
      ownerReqId: request.reqId,
    })
  })
  dispatchWaiting()
}

function collectShard(response: WorkerResponse): boolean {
  const shard = ownerReqIdByShardReqId.get(response.reqId)
  if (shard === undefined) return false
  const { ownerReqId, shardPosition } = shard
  ownerReqIdByShardReqId.delete(response.reqId)
  finishUnit(response.reqId)
  const collector = collectorByReqId.get(ownerReqId)
  if (!collector) return true
  collector.parts[shardPosition] = response
  collector.remaining--
  if (collector.remaining > 0) return true
  collectorByReqId.delete(ownerReqId)
  deliver({ ...mergeShardResponses(collector.parts), reqId: ownerReqId } as WorkerResponse)
  return true
}

function abandonRequests(kind: RequestKind, state: KindState): void {
  stopRunsOf(kind, state, null)
  dropQueued(state)
  state.awaitedReqId = null
  state.lastDeliveredReqId = state.latestReqId
  setPending(state, false)
}

export function postToDpsWorker(unsent: UnsentRequest): void {
  const request = { ...unsent, reqId: ++lastAssignedReqId } as WorkerRequest
  const state = stateFor(request.kind)
  dropQueued(state)
  state.latestReqId = request.reqId
  state.awaitedReqId = null

  const signature = requestSignature(request)
  if (signature !== null) {
    const cached = cachedResponse(request.kind, signature)
    if (cached) {
      stopRunsOf(request.kind, state, null)
      const replay = { ...cached, reqId: request.reqId } as WorkerResponse
      queueMicrotask(() => deliver(replay))
      return
    }
    const alreadyComputing = reqIdAlreadyComputing(state, signature)
    if (alreadyComputing !== null) {
      stopRunsOf(request.kind, state, alreadyComputing)
      state.awaitedReqId = alreadyComputing
      setPending(state, true)
      return
    }
  }

  stopRunsOf(request.kind, state, null)
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
