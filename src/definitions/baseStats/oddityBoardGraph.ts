import {
  ODDITIES,
  ODDITY_CHAPTERS,
  ODDITY_REGIONS,
  type OddityRegionKey,
} from "../../data/baseStats"
import type { UnclaimedOddityNodes } from "../../engine/types"
import type { OddityNodeDef, OddityStat } from "./oddityNodeDef"

export interface OddityBoardRegion {
  key: OddityRegionKey
  chapters: readonly string[]
  nodes: readonly OddityNodeDef[]
  cost: number
}

export const ODDITY_BOARD: readonly OddityBoardRegion[] = ODDITY_REGIONS.map((key) => {
  const nodes = ODDITIES[key]
  return {
    key,
    chapters: ODDITY_CHAPTERS[key],
    nodes,
    cost: nodes.reduce((sum, node) => sum + node.cost, 0),
  }
})

const NODES_BY_REGION = new Map<string, ReadonlyMap<number, OddityNodeDef>>(
  ODDITY_BOARD.map((region) => [region.key, new Map(region.nodes.map((node) => [node.id, node]))]),
)

const CHILDREN_BY_REGION = new Map<string, ReadonlyMap<number, readonly number[]>>(
  ODDITY_BOARD.map((region) => {
    const children = new Map<number, number[]>()
    for (const node of region.nodes) {
      if (node.requires === undefined) continue
      const siblings = children.get(node.requires)
      if (siblings) siblings.push(node.id)
      else children.set(node.requires, [node.id])
    }
    return [region.key, children]
  }),
)

export function oddityRegionNodes(region: string): readonly OddityNodeDef[] {
  return ODDITIES[region as OddityRegionKey] ?? []
}

export function oddityNodeById(region: string, id: number): OddityNodeDef | undefined {
  return NODES_BY_REGION.get(region)?.get(id)
}

export function closeUnclaimedOddityNodes(region: string, ids: Iterable<number>): number[] {
  const children = CHILDREN_BY_REGION.get(region)
  const known = NODES_BY_REGION.get(region)
  const closed = new Set<number>()
  const pending: number[] = []
  for (const id of ids) {
    if (!known?.has(id) || closed.has(id)) continue
    closed.add(id)
    pending.push(id)
  }
  while (pending.length > 0) {
    for (const child of children?.get(pending.pop()!) ?? []) {
      if (closed.has(child)) continue
      closed.add(child)
      pending.push(child)
    }
  }
  return [...closed].sort((left, right) => left - right)
}

export function isOddityNodeClaimed(
  unclaimed: UnclaimedOddityNodes | undefined,
  region: string,
  id: number,
): boolean {
  return !unclaimed?.[region]?.includes(id)
}

export function isOddityNodeReachable(
  unclaimed: UnclaimedOddityNodes | undefined,
  region: string,
  node: OddityNodeDef,
): boolean {
  return node.requires === undefined || isOddityNodeClaimed(unclaimed, region, node.requires)
}

export function withOddityNodeClaimed(
  unclaimed: UnclaimedOddityNodes,
  region: string,
  id: number,
  claimed: boolean,
): UnclaimedOddityNodes {
  const next = new Set(unclaimed[region] ?? [])
  if (claimed) {
    let cursor = oddityNodeById(region, id)
    while (cursor) {
      next.delete(cursor.id)
      cursor = cursor.requires === undefined ? undefined : oddityNodeById(region, cursor.requires)
    }
  } else {
    next.add(id)
  }
  const closed = closeUnclaimedOddityNodes(region, next)
  const out = { ...unclaimed }
  if (closed.length === 0) delete out[region]
  else out[region] = closed
  return out
}

export function claimedOddityNodes(
  unclaimed: UnclaimedOddityNodes | undefined,
  region: string,
): readonly OddityNodeDef[] {
  return oddityRegionNodes(region).filter((node) => isOddityNodeClaimed(unclaimed, region, node.id))
}

export function claimedOddityCost(
  unclaimed: UnclaimedOddityNodes | undefined,
  region: string,
): number {
  return claimedOddityNodes(unclaimed, region).reduce((sum, node) => sum + node.cost, 0)
}

export function oddityBoardTotals(
  unclaimed: UnclaimedOddityNodes | undefined,
): Readonly<Partial<Record<OddityStat, number>>> {
  const totals: Partial<Record<OddityStat, number>> = {}
  for (const region of ODDITY_BOARD) {
    for (const node of region.nodes) {
      if (!node.stat || !node.value) continue
      if (!isOddityNodeClaimed(unclaimed, region.key, node.id)) continue
      totals[node.stat] = (totals[node.stat] ?? 0) + node.value
    }
  }
  return totals
}
