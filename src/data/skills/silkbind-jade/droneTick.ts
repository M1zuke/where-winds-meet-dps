export const DRONE_INTERVAL_FRAMES = 21

export function droneWindowFrames(ticks: number): number {
  return ticks * DRONE_INTERVAL_FRAMES + 1
}

// Workbook 1.2, skill sheet Z3:AC3: each source value includes *1.15.
// The sheet labels the row per second; its rotation also uses fractional
// quantities. Conversion to individual projectile damage remains unverified.
const WORKBOOK_SOURCE_FACTOR = 1.15
// Provisional conversion of the workbook's per-second row to two projectiles.
const ASSUMED_PROJECTILES_PER_SECOND = 2

export const DRONE_TICK = {
  physMultiplier: 1.174955 / WORKBOOK_SOURCE_FACTOR / ASSUMED_PROJECTILES_PER_SECOND,
  physFixed: 324.3 / WORKBOOK_SOURCE_FACTOR / ASSUMED_PROJECTILES_PER_SECOND,
  attributeMultiplier: 1.762375 / WORKBOOK_SOURCE_FACTOR / ASSUMED_PROJECTILES_PER_SECOND,
  attributeFixed: 177.1 / WORKBOOK_SOURCE_FACTOR / ASSUMED_PROJECTILES_PER_SECOND,
  extraCritDamage: 1,
}
