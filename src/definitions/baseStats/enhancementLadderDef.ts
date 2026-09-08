type TupleOfLength<
  Row,
  Length extends number,
  Built extends Row[] = [],
> = Built["length"] extends Length ? Built : TupleOfLength<Row, Length, [...Built, Row]>

export type LadderLevels<Row> = Readonly<TupleOfLength<Row, 65>>
export type AverageBonusLevels = Readonly<TupleOfLength<AverageEnhancementBonusLevel, 17>>

export interface WeaponEnhancementLevel {
  minPhys: number
  maxPhys: number
}

export interface DiscPendantEnhancementLevel {
  maxPhys: number
}

export interface HelmBracerEnhancementLevel {
  maxHp: number
}

export interface ChestGreavesEnhancementLevel {
  maxHp: number
  physDef: number
}

export interface AverageEnhancementBonusLevel {
  maxHp: number
  percent: number
}

export function defineWeaponLevels(levels: LadderLevels<WeaponEnhancementLevel>): typeof levels {
  return levels
}

export function defineDiscPendantLevels(
  levels: LadderLevels<DiscPendantEnhancementLevel>,
): typeof levels {
  return levels
}

export function defineHelmBracerLevels(
  levels: LadderLevels<HelmBracerEnhancementLevel>,
): typeof levels {
  return levels
}

export function defineChestGreavesLevels(
  levels: LadderLevels<ChestGreavesEnhancementLevel>,
): typeof levels {
  return levels
}

export function defineAverageEnhancementBonusLevels(levels: AverageBonusLevels): typeof levels {
  return levels
}
