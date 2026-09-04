import { defineTalentPoint, type TalentPointDef } from "../../definitions/baseStats/talentPointDef"

export const TALENT_POINT_TIERS = ["95.1", "95.2", "100.1", "100.2"] as const

export type TalentPointTier = (typeof TALENT_POINT_TIERS)[number]

const TIER_95_1: readonly TalentPointDef[] = [
  defineTalentPoint({ id: 1, effects: { critRate: 0.04 } }),
  defineTalentPoint({ id: 2, effects: { critDamage: 0.05 } }),
  defineTalentPoint({ id: 3, effects: { precisionRate: 0.03 } }),
  defineTalentPoint({ id: 4, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 5, effects: { affinityDamage: 0.05 } }),
  defineTalentPoint({ id: 6, effects: { critRate: 0.04 } }),
  defineTalentPoint({ id: 7, effects: { critDamage: 0.05 } }),
  defineTalentPoint({ id: 8, effects: { precisionRate: 0.03 } }),
  defineTalentPoint({ id: 9, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 10, effects: { affinityDamage: 0.05 } }),
  defineTalentPoint({ id: 11, effects: { critRate: 0.04 } }),
  defineTalentPoint({ id: 12, effects: { critDamage: 0.05 } }),
  defineTalentPoint({ id: 13, effects: { precisionRate: 0.03 } }),
  defineTalentPoint({ id: 14, effects: { maxPhys: 52.8 } }),
  defineTalentPoint({ id: 15, effects: { minPhys: 52.8 } }),
  defineTalentPoint({ id: 16, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 17, effects: { affinityDamage: 0.05 } }),
  defineTalentPoint({ id: 18, effects: { precisionRate: 0.015 } }),
  defineTalentPoint({ id: 19, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 20, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 21, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 22, effects: { critRate: 0.04 } }),
  defineTalentPoint({ id: 23, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 24, effects: { precisionRate: 0.015 } }),
  defineTalentPoint({ id: 25, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 26, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 27, effects: { maxPhys: 26.4 } }),
  defineTalentPoint({ id: 28, effects: { minPhys: 26.4 } }),
  defineTalentPoint({ id: 29, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 30, effects: { precisionRate: 0.015 } }),
  defineTalentPoint({ id: 31, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 32, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 33, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 34, effects: { maxPhys: 26.4 } }),
  defineTalentPoint({ id: 35, effects: { minPhys: 26.4 } }),
]

const TIER_95_2: readonly TalentPointDef[] = [
  defineTalentPoint({ id: 1, effects: { precisionRate: 0.015 } }),
  defineTalentPoint({ id: 2, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 3, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 4, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 5, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 6, effects: { critRate: 0.04 } }),
]

const TIER_100_1: readonly TalentPointDef[] = [
  defineTalentPoint({ id: 1, effects: { precisionRate: 0.015 } }),
  defineTalentPoint({ id: 2, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 3, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 4, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 5, effects: { affinityRate: 0.02 } }),
  defineTalentPoint({ id: 6, effects: { critRate: 0.04 } }),
]

const TIER_100_2: readonly TalentPointDef[] = [
  defineTalentPoint({ id: 1, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 2, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 3, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 4, effects: { power: 1, agility: 1, momentum: 1 } }),
  defineTalentPoint({ id: 5, effects: { maxFormless: 13.2 } }),
  defineTalentPoint({ id: 6, effects: { minFormless: 13.2 } }),
]

export const TALENT_POINTS: Readonly<Record<TalentPointTier, readonly TalentPointDef[]>> = {
  "95.1": TIER_95_1,
  "95.2": TIER_95_2,
  "100.1": TIER_100_1,
  "100.2": TIER_100_2,
}
