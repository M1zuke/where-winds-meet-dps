export const PING_MS_MIN = 0
export const PING_MS_MAX = 1000
export const AVERAGE_FPS_MIN = 10
export const AVERAGE_FPS_MAX = 360

export const SERVER_PROCESSING_MS_MIN = 0
export const SERVER_PROCESSING_MS_MAX = 1000

export const DEFAULT_PING_MS = 10
export const DEFAULT_AVERAGE_FPS = 250
// Calibrated from an in-game run at 10 ms / 250 fps, 2026-10-02.
export const DEFAULT_SERVER_PROCESSING_MS = 32

export function isValidPingMs(value: number): boolean {
  return Number.isInteger(value) && value >= PING_MS_MIN && value <= PING_MS_MAX
}

export function isValidServerProcessingMs(value: number): boolean {
  return (
    Number.isFinite(value) && value >= SERVER_PROCESSING_MS_MIN && value <= SERVER_PROCESSING_MS_MAX
  )
}

export function isValidAverageFps(value: number): boolean {
  return Number.isFinite(value) && value >= AVERAGE_FPS_MIN && value <= AVERAGE_FPS_MAX
}

export function resolvePingMs(value: number | null): number {
  return value !== null && isValidPingMs(value) ? value : DEFAULT_PING_MS
}

export function resolveAverageFps(value: number | null): number {
  return value !== null && isValidAverageFps(value) ? value : DEFAULT_AVERAGE_FPS
}

export function resolveServerProcessingMs(value: number | null): number {
  return value !== null && isValidServerProcessingMs(value) ? value : DEFAULT_SERVER_PROCESSING_MS
}
