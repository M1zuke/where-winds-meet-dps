import type { ProjectileSpec } from "../../../engine/skill"

// In-game values as of 2026-10-15: Daunting Strike's flying sword travels at
// 40 m/s over 13 m, Shadow Step's bolt at 32 m/s over 12.8 m.
export const DAUNTING_STRIKE_PROJECTILE: ProjectileSpec = {
  speedMetersPerSecond: 40,
  maxTravelFrames: 19.5,
}

export const SHADOW_STEP_PROJECTILE: ProjectileSpec = {
  speedMetersPerSecond: 32,
  maxTravelFrames: 24,
}
