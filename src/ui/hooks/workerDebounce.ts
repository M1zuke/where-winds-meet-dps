import type { WorkerRequest } from "../../engine/dpsWorker"

export const WORKER_DEBOUNCE_MS = 150

const DEBOUNCE_MS_BY_KIND: Partial<Record<WorkerRequest["kind"], number>> = {
  parseSimulation: 0,
  parseSimulationCancel: 0,
}

export function debounceMsFor(kind: WorkerRequest["kind"]): number {
  return DEBOUNCE_MS_BY_KIND[kind] ?? WORKER_DEBOUNCE_MS
}
