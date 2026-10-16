import type { ProjectileSpec } from "../../../engine/skill"

// In-game values as of 2026-10-15: the level 2 bolts and waves fly at 36 m/s
// for 0.5 s, the level 1 bolt for 0.4 s.
export const VAGRANT_SWORD_WAVE_PROJECTILE: ProjectileSpec = {
  speedMetersPerSecond: 36,
  maxTravelFrames: 30,
}

export const VAGRANT_SWORD_TIER_1_PROJECTILE: ProjectileSpec = {
  speedMetersPerSecond: 36,
  maxTravelFrames: 24,
}
