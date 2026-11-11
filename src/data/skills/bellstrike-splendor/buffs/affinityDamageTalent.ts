const AFFINITY_RATE_STEP = 0.01
const AFFINITY_DAMAGE_PER_STEP = 0.006
const AFFINITY_DAMAGE_CAP = 0.18

// In-game values as of 2026-11-10: per whole 1% of the build's Affinity Rate.
export function affinityDamageTalentBonus(whiteAffinityRate: number): number {
  return Math.min(
    AFFINITY_DAMAGE_CAP,
    Math.floor(whiteAffinityRate / AFFINITY_RATE_STEP) * AFFINITY_DAMAGE_PER_STEP,
  )
}
