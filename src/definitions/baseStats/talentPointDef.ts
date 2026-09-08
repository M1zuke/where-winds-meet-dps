export type TalentPointStat =
  | "minPhys"
  | "maxPhys"
  | "minFormless"
  | "maxFormless"
  | "precisionRate"
  | "critRate"
  | "affinityRate"
  | "critDamage"
  | "affinityDamage"
  | "power"
  | "agility"
  | "momentum"
  | "body"
  | "defense"
  | "maxHp"
  | "physDef"

export type TalentPointEffects = Readonly<Partial<Record<TalentPointStat, number>>>

export interface TalentPointDef {
  id: number
  effects: TalentPointEffects
}

export function defineTalentPoint<const T extends TalentPointDef>(point: T): T {
  return point
}
