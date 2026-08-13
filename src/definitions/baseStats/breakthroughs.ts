import breakthroughTiers from "../../data/baseStats/breakthroughTiers.json"

export interface BreakthroughAttribute {
  id: number
  stat: string
  value: number
}

export interface BreakthroughTier {
  breakthrough: number
  name: string
  levelRange: string
  resistance: number
  defense: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  multiplier: number
  attributes?: BreakthroughAttribute[]
}

export const BREAKTHROUGH_TIERS: readonly BreakthroughTier[] = [
  ...(breakthroughTiers as BreakthroughTier[]),
].sort((left, right) => left.breakthrough - right.breakthrough)

export function getBreakthrough(breakthrough: number): BreakthroughTier {
  const tier = BREAKTHROUGH_TIERS.find((candidate) => candidate.breakthrough === breakthrough)
  if (!tier) throw new Error(`Unknown breakthrough: ${breakthrough}`)
  return tier
}

const MEASURED_TIERS = BREAKTHROUGH_TIERS.filter((tier) => tier.attributes?.length)

// Only breakthroughs 14-17 have a measured attribute table (in-game,
// 2026-07-24); a tier outside it resolves to the nearest measured one.
export function breakthroughAttributes(breakthrough: number): readonly BreakthroughAttribute[] {
  let nearest: BreakthroughTier | undefined
  for (const tier of MEASURED_TIERS) {
    const isCloser =
      !nearest ||
      Math.abs(tier.breakthrough - breakthrough) < Math.abs(nearest.breakthrough - breakthrough)
    if (isCloser) nearest = tier
  }
  return nearest?.attributes ?? []
}
