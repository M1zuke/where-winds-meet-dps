import { PARSE_RUN_CAP } from "../../../engine/dpsWorker"

export const DEFAULT_RUN_COUNT = 1000
export const MIN_RUN_COUNT = 100
export const MAX_RUN_COUNT = PARSE_RUN_CAP
export const RUN_COUNT_STEP = 100

export function clampRunCount(requested: number): number {
  if (!Number.isFinite(requested)) return DEFAULT_RUN_COUNT
  return Math.min(MAX_RUN_COUNT, Math.max(MIN_RUN_COUNT, Math.round(requested)))
}
