export const DRONE_INTERVAL_FRAMES = 21

export function droneWindowFrames(ticks: number): number {
  return ticks * DRONE_INTERVAL_FRAMES + 1
}

// In-game values as of 2026-09-24.
export const DRONE_TICK = {
  physMultiplier: 0.510829,
  physFixed: 141.375,
  attributeMultiplier: 0.766243,
  attributeFixed: 77,
  extraCritDamage: 1,
}
