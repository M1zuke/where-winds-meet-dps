// In-game values as of 2026-09-24.
export const DRONE_INTERVAL_FRAMES = 30
export const DRONE_FIRST_TICK_OFFSET_FRAMES = 33

export function droneWindowFrames(ticks: number): number {
  return DRONE_FIRST_TICK_OFFSET_FRAMES + (ticks - 1) * DRONE_INTERVAL_FRAMES + 1
}

// In-game values as of 2026-09-24.
export const DRONE_TICK = {
  physMultiplier: 0.510829,
  physFixed: 141.375,
  attributeMultiplier: 0.766243,
  attributeFixed: 77,
  extraCritDamage: 1,
}
