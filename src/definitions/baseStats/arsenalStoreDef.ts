type TupleOfLength<
  Row,
  Length extends number,
  Built extends Row[] = [],
> = Built["length"] extends Length ? Built : TupleOfLength<Row, Length, [...Built, Row]>

export type ArsenalStoreLevels = Readonly<TupleOfLength<ArsenalStore, 10>>

export interface ArsenalStore {
  gearTier: number
  graduationPromotion: number
  ratioA: number
  ratioB: number
  ratioC: number
  totalMastery: number
}

export function defineArsenalStores(stores: ArsenalStoreLevels): typeof stores {
  return stores
}
