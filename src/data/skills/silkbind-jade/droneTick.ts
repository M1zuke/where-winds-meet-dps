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
  // In-game hit type as of 2026-09-25: a direct hit, not a DoT tick — decides
  // the post-break 4 s immunity only; the app still types the damage itself
  // as a DoT tick (docs/TIMELINE.md § "Qi bar").
  qiHitKind: "direct" as const,
}
