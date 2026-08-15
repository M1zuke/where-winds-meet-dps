export interface FinalCritAffinityRateInputs {
  precision: number
  critRate: number
  directCritRate: number
  affinityRate: number
  directAffinityRate: number
}

export function finalCritAffinityRates({
  precision,
  critRate,
  directCritRate,
  affinityRate,
  directAffinityRate,
}: FinalCritAffinityRateInputs): { critRate: number; affinityRate: number } {
  const totalCritRate = critRate + directCritRate
  const totalAffinityRate = affinityRate + directAffinityRate
  const critRateBeforePrecision =
    totalCritRate + totalAffinityRate <= 1 ? totalCritRate : 1 - totalAffinityRate

  return {
    critRate: precision * critRateBeforePrecision,
    affinityRate: totalAffinityRate,
  }
}
