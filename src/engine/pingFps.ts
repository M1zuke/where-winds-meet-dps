export const PING_MS_MIN = 0
export const PING_MS_MAX = 1000
export const AVERAGE_FPS_MIN = 10
export const AVERAGE_FPS_MAX = 360

export const DEFAULT_PING_MS = 0
export const DEFAULT_AVERAGE_FPS = 60

export function isValidPingMs(value: number): boolean {
  return Number.isInteger(value) && value >= PING_MS_MIN && value <= PING_MS_MAX
}

export function isValidAverageFps(value: number): boolean {
  return Number.isFinite(value) && value >= AVERAGE_FPS_MIN && value <= AVERAGE_FPS_MAX
}

export function hasValidPingAndFps(pingMs: number | null, averageFps: number | null): boolean {
  return (
    pingMs !== null && averageFps !== null && isValidPingMs(pingMs) && isValidAverageFps(averageFps)
  )
}

export function resolvePingMs(value: number | null): number {
  return value !== null && isValidPingMs(value) ? value : DEFAULT_PING_MS
}

export function resolveAverageFps(value: number | null): number {
  return value !== null && isValidAverageFps(value) ? value : DEFAULT_AVERAGE_FPS
}
