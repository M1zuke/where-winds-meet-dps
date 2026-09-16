import { AFFINITY_RATE_CAP, CRIT_RATE_CAP, PRECISION_RATE_CAP } from "../../../engine/formula"

export interface FinalHitOutcomeRateInputs {
  precision: number
  critRate: number
  directCritRate: number
  affinityRate: number
  directAffinityRate: number
}

export interface FinalHitOutcomeRates {
  critRate: number
  affinityRate: number
  abrasionRate: number
  normalRate: number
}

export function finalHitOutcomeRates({
  precision,
  critRate,
  directCritRate,
  affinityRate,
  directAffinityRate,
}: FinalHitOutcomeRateInputs): FinalHitOutcomeRates {
  const totalCritRate = Math.min(Math.max(critRate, 0), CRIT_RATE_CAP) + directCritRate
  const totalAffinityRate =
    Math.min(Math.max(affinityRate, 0), AFFINITY_RATE_CAP) + directAffinityRate
  const rollingPrecision = Math.min(precision, PRECISION_RATE_CAP)
  const missedPrecision = 1 - rollingPrecision
  const roomLeftByAffinity = Math.max(1 - totalAffinityRate, 0)

  const finalCritRate = rollingPrecision * Math.min(totalCritRate, roomLeftByAffinity)
  const abrasionRate = missedPrecision * roomLeftByAffinity

  return {
    critRate: finalCritRate,
    affinityRate: totalAffinityRate,
    abrasionRate,
    normalRate: Math.max(1 - abrasionRate - finalCritRate - totalAffinityRate, 0),
  }
}
