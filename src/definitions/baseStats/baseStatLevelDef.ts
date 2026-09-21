export interface BaseStatLevel {
  minPhys: number
  maxPhys: number
  precisionRate: number
  critRate: number
  affinityRate: number
  critDamage: number
  affinityDamage: number
  maxHp: number
  physDef: number
}

export function defineBaseStatLevel(level: BaseStatLevel): BaseStatLevel {
  return level
}
