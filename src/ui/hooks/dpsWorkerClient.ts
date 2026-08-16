import type { WorkerRequest, WorkerResponse } from "../../engine/dpsWorker"
import DpsWorker from "../../engine/dpsWorker?worker"
import { debounceMsFor } from "./workerDebounce"
import { cacheResponse, cachedResponse, requestSignature } from "./workerResultCache"

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

interface KindState {
  responseListeners: Set<ResponseListener>
  pendingListeners: Set<() => void>
  progressListeners: Set<ProgressListener>
  queued: WorkerRequest | null
  debounceHandle: ReturnType<typeof setTimeout> | null
  latestReqId: number
  lastDeliveredReqId: number
  isPending: boolean
  retained: WorkerResponse | null
  signatureByReqId: Map<number, string>
}

const stateByKind = new Map<RequestKind, KindState>()
const pool: Worker[] = []
const workerByKind = new Map<RequestKind, Worker>()
let lastAssignedReqId = 0

function stateFor(kind: RequestKind): KindState {
  const existing = stateByKind.get(kind)
  if (existing) return existing
  const created: KindState = {
    responseListeners: new Set(),
    pendingListeners: new Set(),
    progressListeners: new Set(),
    queued: null,
    debounceHandle: null,
    latestReqId: -1,
    lastDeliveredReqId: -1,
    isPending: false,
    retained: null,
    signatureByReqId: new Map(),
  }
  stateByKind.set(kind, created)
  return created
}

function poolSize(): number {
  const cores = navigator.hardwareConcurrency || MAX_POOL_SIZE
  return Math.max(1, Math.min(MAX_POOL_SIZE, cores - 1))
}

function workerFor(kind: RequestKind): Worker {
  const assigned = workerByKind.get(kind)
  if (assigned) return assigned
  if (pool.length < poolSize()) {
    const worker = new DpsWorker()
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => receive(event.data)
    pool.push(worker)
  }
  const worker = pool[workerByKind.size % pool.length]
  workerByKind.set(kind, worker)
  return worker
}

function setPending(state: KindState, isPending: boolean): void {
  if (state.isPending === isPending) return
  state.isPending = isPending
  for (const listener of state.pendingListeners) listener()
}

function receive(response: WorkerResponse): void {
  const owner = PROGRESS_OWNER_KIND[response.kind]
  if (owner) deliverProgress(owner, response as ProgressResponse)
  else deliver(response)
}

function deliverProgress(kind: RequestKind, progress: ProgressResponse): void {
  const state = stateFor(kind)
  if (progress.reqId !== state.latestReqId) return
  for (const listener of state.progressListeners) listener(progress)
}

function deliver(response: WorkerResponse): void {
  const kind = response.kind as RequestKind
  const state = stateFor(kind)
  const signature = state.signatureByReqId.get(response.reqId)
  if (signature !== undefined) {
    state.signatureByReqId.delete(response.reqId)
    cacheResponse(kind, signature, response)
  }
  if (response.reqId === state.latestReqId) setPending(state, false)
  if (response.reqId <= state.lastDeliveredReqId) return
  state.lastDeliveredReqId = response.reqId
  state.retained = response
  for (const listener of state.responseListeners) listener(response)
}

function postCancel(kind: RequestKind, state: KindState): void {
  const cancelKind = CANCEL_KIND_BY_KIND[kind]
  if (!cancelKind) return
  if (state.latestReqId <= state.lastDeliveredReqId) return
  workerFor(kind).postMessage({ kind: cancelKind, reqId: state.latestReqId })
}

function abandonRequests(kind: RequestKind, state: KindState): void {
  postCancel(kind, state)
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = null
  state.queued = null
  state.signatureByReqId.clear()
  state.lastDeliveredReqId = state.latestReqId
  setPending(state, false)
}

export function postToDpsWorker(unsent: UnsentRequest): void {
  const request = { ...unsent, reqId: ++lastAssignedReqId } as WorkerRequest
  const state = stateFor(request.kind)
  postCancel(request.kind, state)
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = null
  state.queued = null
  state.latestReqId = request.reqId

  const signature = requestSignature(request)
  const cached = signature === null ? null : cachedResponse(request.kind, signature)
  if (cached) {
    const replay = { ...cached, reqId: request.reqId } as WorkerResponse
    queueMicrotask(() => deliver(replay))
    return
  }
  if (signature !== null) state.signatureByReqId.set(request.reqId, signature)

  state.queued = request
  setPending(state, true)
  const delayMs = debounceMsFor(request.kind)
  if (delayMs <= 0) {
    state.queued = null
    workerFor(request.kind).postMessage(request)
    return
  }
  state.debounceHandle = setTimeout(() => {
    state.debounceHandle = null
    const queued = state.queued
    state.queued = null
    if (queued) workerFor(queued.kind).postMessage(queued)
  }, delayMs)
}

export function cancelDpsWorkerRequest(kind: RequestKind): void {
  const state = stateFor(kind)
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = null
  state.queued = null
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
