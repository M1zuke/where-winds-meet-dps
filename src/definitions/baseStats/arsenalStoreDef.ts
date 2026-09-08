type TupleOfLength<
  Row,
  Length extends number,
  Built extends Row[] = [],
> = Built["length"] extends Length ? Built : TupleOfLength<Row, Length, [...Built, Row]>

export type ArsenalStoreLevels = Readonly<TupleOfLength<ArsenalStore, 10>>

export interface ArsenalAttackRung {
  min: number
  max: number
}

export type ArsenalAttackLadder = Readonly<TupleOfLength<ArsenalAttackRung, 7>>

export interface ArsenalStore {
  gearTier: number
  graduationPromotion: number
  ratioA: number
  ratioB: number
  ratioC: number
  totalMastery: number
  attackLadder: ArsenalAttackLadder
}

export function defineArsenalStores(stores: ArsenalStoreLevels): typeof stores {
  return stores
}
