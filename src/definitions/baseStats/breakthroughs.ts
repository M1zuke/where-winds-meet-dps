import breakthroughTiers from "../../data/baseStats/breakthroughTiers.json"
import type { GearLevel } from "../../engine/types"

export interface BreakthroughAttribute {
  id: number
  stat: string
  value: number
}

export interface BreakthroughTier {
  breakthrough: number
  gearLevel: GearLevel
  name: string
  levelRange: string
  resistance: number
  defense: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  multiplier: number
  attributes?: BreakthroughAttribute[]
  // In-game unlock instant, UTC. A tier without one is already live.
  release?: string
}

export const BREAKTHROUGH_TIERS: readonly BreakthroughTier[] = [
  ...(breakthroughTiers as BreakthroughTier[]),
].sort((left, right) => left.breakthrough - right.breakthrough)

const DEFAULT_BREAKTHROUGH_BEFORE_ANY_RELEASE = 16

export interface BreakthroughRelease {
  breakthrough: number
  at: number
}

export const BREAKTHROUGH_RELEASES: readonly BreakthroughRelease[] = BREAKTHROUGH_TIERS.filter(
  (tier) => typeof tier.release === "string" && !Number.isNaN(Date.parse(tier.release)),
)
  .map((tier) => ({ breakthrough: tier.breakthrough, at: Date.parse(tier.release!) }))
  .sort((left, right) => left.at - right.at)

export function releasedBreakthroughs(now: number = Date.now()): readonly BreakthroughRelease[] {
  return BREAKTHROUGH_RELEASES.filter((release) => now >= release.at)
}

export function newestBreakthroughRelease(now: number = Date.now()): number {
  return releasedBreakthroughs(now).reduce((highest, release) => {
    return release.breakthrough > highest ? release.breakthrough : highest
  }, 0)
}

export function defaultBreakthrough(now: number = Date.now()): number {
  return Math.max(newestBreakthroughRelease(now), DEFAULT_BREAKTHROUGH_BEFORE_ANY_RELEASE)
}

export function getBreakthrough(breakthrough: number): BreakthroughTier {
  const tier = BREAKTHROUGH_TIERS.find((candidate) => candidate.breakthrough === breakthrough)
  if (!tier) throw new Error(`Unknown breakthrough: ${breakthrough}`)
  return tier
}

export function gearLevelForBreakthrough(breakthrough: number): GearLevel {
  const atOrBelow = BREAKTHROUGH_TIERS.filter((tier) => tier.breakthrough <= breakthrough)
  const tier = atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1]! : BREAKTHROUGH_TIERS[0]!
  return tier.gearLevel
}

export function gearLevelsUpTo(breakthrough: number): GearLevel[] {
  const reached = new Set(
    BREAKTHROUGH_TIERS.filter((tier) => tier.breakthrough <= breakthrough).map(
      (tier) => tier.gearLevel,
    ),
  )
  const levels = [...reached].sort((left, right) => left - right)
  return levels.length > 0 ? levels : [BREAKTHROUGH_TIERS[0]!.gearLevel]
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
