export type OddityStat = "minPhys" | "maxPhys" | "maxHp" | "physDef"

export interface OddityNodeDef {
  readonly id: number
  readonly stat: OddityStat
  readonly value: number
}

type UniqueOddityIds<
  Nodes extends readonly OddityNodeDef[],
  Seen extends number = never,
> = Nodes extends readonly [
  infer Head extends OddityNodeDef,
  ...infer Tail extends readonly OddityNodeDef[],
]
  ? Head["id"] extends Seen
    ? false
    : UniqueOddityIds<Tail, Seen | Head["id"]>
  : true

export function defineOddityRegion<const Nodes extends readonly OddityNodeDef[]>(
  nodes: UniqueOddityIds<Nodes> extends true ? Nodes : { duplicateOddityNodeId: true },
): Nodes {
  return nodes as Nodes
}
