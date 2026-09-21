import type { GearLevel } from "../../engine/types"

export type BreakthroughAttributeStat =
  "precisionRate" | "power" | "agility" | "momentum" | "body" | "defense"

export interface BreakthroughAttribute {
  id: number
  stat: BreakthroughAttributeStat
  value: number
}

export interface BreakthroughTier {
  breakthrough: number
  // The practice target's in-game health pool, as of 2026-09-10.
  targetHp: number
  gearLevel: GearLevel
  name: string
  levelRange: string
  resistance: number
  defense: number
  // Breakthrough 21 repeats 20's figures by the season pattern — nothing
  // above world level 20 has shipped yet to read them from directly.
  physPenResistance: number
  attrPenResistance: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  damageReduction: number
  physDamageBoostReduction: number
  attrDamageBoostReduction: number
  critDamageReduction: number
  affinityDamageReduction: number
  // In-game unlock instant, UTC. A tier without one is already live.
  release?: string
  attributes?: readonly BreakthroughAttribute[]
}

type UniqueBreakthroughs<
  Tiers extends readonly BreakthroughTier[],
  Seen extends number = never,
> = Tiers extends readonly [
  infer Head extends BreakthroughTier,
  ...infer Tail extends readonly BreakthroughTier[],
]
  ? Head["breakthrough"] extends Seen
    ? false
    : UniqueBreakthroughs<Tail, Seen | Head["breakthrough"]>
  : true

type NoExtraKeys<Tiers extends readonly BreakthroughTier[]> = {
  [Index in keyof Tiers]: Tiers[Index] & {
    [Key in Exclude<keyof Tiers[Index], keyof BreakthroughTier>]: never
  }
}

export function defineBreakthroughTiers<const Tiers extends readonly BreakthroughTier[]>(
  tiers: UniqueBreakthroughs<Tiers> extends true
    ? NoExtraKeys<Tiers>
    : { duplicateBreakthrough: true },
): readonly BreakthroughTier[] {
  return tiers as readonly BreakthroughTier[]
}
