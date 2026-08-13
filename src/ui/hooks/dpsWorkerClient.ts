import type { WorkerRequest, WorkerResponse } from "../../engine/dpsWorker"
import DpsWorker from "../../engine/dpsWorker?worker"
import { WORKER_DEBOUNCE_MS } from "./workerDebounce"

type RequestKind = WorkerRequest["kind"]
type ResponseOfKind<K extends RequestKind> = Extract<WorkerResponse, { kind: K }>
type ResponseListener = (response: WorkerResponse) => void

const MAX_POOL_SIZE = 4

interface KindState {
  responseListeners: Set<ResponseListener>
  pendingListeners: Set<() => void>
  queued: WorkerRequest | null
  debounceHandle: ReturnType<typeof setTimeout> | null
  latestReqId: number
  lastDeliveredReqId: number
  isPending: boolean
}

const stateByKind = new Map<RequestKind, KindState>()
const pool: Worker[] = []
const workerByKind = new Map<RequestKind, Worker>()

function stateFor(kind: RequestKind): KindState {
  const existing = stateByKind.get(kind)
  if (existing) return existing
  const created: KindState = {
    responseListeners: new Set(),
    pendingListeners: new Set(),
    queued: null,
    debounceHandle: null,
    latestReqId: -1,
    lastDeliveredReqId: -1,
    isPending: false,
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
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => deliver(event.data)
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

function deliver(response: WorkerResponse): void {
  const state = stateFor(response.kind)
  if (response.reqId === state.latestReqId) setPending(state, false)
  if (response.reqId < state.lastDeliveredReqId) return
  state.lastDeliveredReqId = response.reqId
  for (const listener of state.responseListeners) listener(response)
}

function cancelQueued(state: KindState): void {
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = null
  state.queued = null
  setPending(state, false)
}

export function postToDpsWorker(request: WorkerRequest): void {
  const state = stateFor(request.kind)
  state.queued = request
  state.latestReqId = request.reqId
  setPending(state, true)
  if (state.debounceHandle !== null) clearTimeout(state.debounceHandle)
  state.debounceHandle = setTimeout(() => {
    state.debounceHandle = null
    const queued = state.queued
    state.queued = null
    if (queued) workerFor(queued.kind).postMessage(queued)
  }, WORKER_DEBOUNCE_MS)
}

export function subscribeToDpsWorker<K extends RequestKind>(
  kind: K,
  listener: (response: ResponseOfKind<K>) => void,
): () => void {
  const state = stateFor(kind)
  const typedListener = listener as ResponseListener
  state.responseListeners.add(typedListener)
  return () => {
    state.responseListeners.delete(typedListener)
    if (state.responseListeners.size === 0) cancelQueued(state)
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
