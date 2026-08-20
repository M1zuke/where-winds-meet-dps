// One assist attack every 0.35s whatever the drone's size; the size sets how
// many land, so the window follows from the count. The reference debuffs
// instead vary the interval per variant (35/26/21/18/16 frames) to normalize
// every drone to a ~7s window — that is a modelling artifact, not how the
// drone behaves, and only its 20-tick variant agrees with the real cadence.
export const DRONE_INTERVAL_FRAMES = 21

export function droneWindowFrames(ticks: number): number {
  return ticks * DRONE_INTERVAL_FRAMES + 1
}

// Per TICK, despite the workbook row calling itself a per-second rate: its
// rotation spends a constant 10 units per throw against a drone lasting ~7s,
// so a unit is one assist attack (workbook v1.2, 2026-08-14). Every variant
// shares these — only the count differs.
//
// The row spreads its total over 20 ticks where the reference debuff spreads
// the same total over 23: measured against it, every one of the four tracks is
// a uniform 1.150 high, and 23/20 = 1.150 exactly (workbook 1.174955 × 20/23 =
// 1.02170 against the reference's 1.0215).
const WORKBOOK_TICKS = 20
const REFERENCE_TICKS = 23
const TICK_SPREAD = REFERENCE_TICKS / WORKBOOK_TICKS

// The row is a measurement of the ENHANCED projectile: it is a per-second rate
// taken from a real rotation, where Lingering Bone is up for essentially the
// whole drone window, so the umbrella's "100% extra damage" is already inside
// it. Halved here so this states the base projectile and `lingeringBone`
// supplies the enhancement itself — otherwise the two compound and the drone
// reads ×1.53 of the reference instead of ×0.84.
const ENHANCEMENT_BAKED_IN = 2

// Both divisors apply to all four tracks: the enhancement scales a tick's flat
// damage exactly as it scales its coefficient, so dividing one out without the
// other would leave the flat half of every projectile enhanced.
export const DRONE_TICK = {
  physMultiplier: 1.174955 / TICK_SPREAD / ENHANCEMENT_BAKED_IN,
  physFixed: 324.3 / TICK_SPREAD / ENHANCEMENT_BAKED_IN,
  attributeMultiplier: 1.762375 / TICK_SPREAD / ENHANCEMENT_BAKED_IN,
  attributeFixed: 177.1 / TICK_SPREAD / ENHANCEMENT_BAKED_IN,
  // The same min-phys crit gate every other Umbrella hit carries, and what the
  // workbook row's Critical DMG 0.36 is: a drone projectile is an Umbrella hit.
  extraCritDamage: 1,
}
