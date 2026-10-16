import {
  ODDITIES,
  ODDITY_CHAPTERS,
  ODDITY_REGION_LABELS,
  ODDITY_REGIONS,
  ODDITY_REGION_RELEASED,
  ODDITY_RESOURCE_CAPS,
  type OddityRegionKey,
} from "../../data/baseStats"
import type { UnclaimedOddityNodes } from "../../engine/types"
import type { OddityNodeDef, OddityStat } from "./oddityNodeDef"

export interface OddityBoardRegion {
  key: OddityRegionKey
  label: string
  released: boolean
  chapters: readonly string[]
  nodes: readonly OddityNodeDef[]
  cost: number
}

export const ODDITY_BOARD: readonly OddityBoardRegion[] = ODDITY_REGIONS.map((key) => {
  const nodes = ODDITIES[key]
  return {
    key,
    label: ODDITY_REGION_LABELS[key],
    released: ODDITY_REGION_RELEASED[key],
    chapters: ODDITY_CHAPTERS[key],
    nodes,
    cost: nodes.reduce((sum, node) => sum + node.cost, 0),
  }
})

export const RELEASED_ODDITY_BOARD: readonly OddityBoardRegion[] = ODDITY_BOARD.filter(
  (region) => region.released,
)

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

export interface OddityBoardAccounting {
  totals: Readonly<Partial<Record<OddityStat, number>>>
  converted: ReadonlySet<string>
}

function convertedNodeKey(region: string, id: number): string {
  return `${region}:${id}`
}

export function accountOddityBoard(
  regions: readonly OddityBoardRegion[],
  unclaimed: UnclaimedOddityNodes | undefined,
): OddityBoardAccounting {
  const totals: Partial<Record<OddityStat, number>> = {}
  const converted = new Set<string>()
  for (const region of regions) {
    for (const node of region.nodes) {
      if (!node.stat || !node.value) continue
      if (!isOddityNodeClaimed(unclaimed, region.key, node.id)) continue
      if (
        (node.stat === "endurance" || node.stat === "vitality") &&
        node.fallbackMaxHp !== undefined &&
        (totals[node.stat] ?? 0) >= ODDITY_RESOURCE_CAPS[node.stat]
      ) {
        totals.maxHp = (totals.maxHp ?? 0) + node.fallbackMaxHp
        converted.add(convertedNodeKey(region.key, node.id))
        continue
      }
      totals[node.stat] = (totals[node.stat] ?? 0) + node.value
    }
  }
  return { totals, converted }
}

export function oddityBoardTotals(
  unclaimed: UnclaimedOddityNodes | undefined,
): Readonly<Partial<Record<OddityStat, number>>> {
  return accountOddityBoard(RELEASED_ODDITY_BOARD, unclaimed).totals
}

export function convertedOddityNodes(
  unclaimed: UnclaimedOddityNodes | undefined,
): ReadonlySet<string> {
  return accountOddityBoard(RELEASED_ODDITY_BOARD, unclaimed).converted
}

export function isOddityNodeConverted(
  converted: ReadonlySet<string>,
  region: string,
  id: number,
): boolean {
  return converted.has(convertedNodeKey(region, id))
}

export function withReleasedOddityRegionsReset(
  unclaimed: UnclaimedOddityNodes,
): UnclaimedOddityNodes {
  const releasedKeys = new Set<string>(RELEASED_ODDITY_BOARD.map((region) => region.key))
  return Object.fromEntries(
    Object.entries(unclaimed).filter(([region]) => !releasedKeys.has(region)),
  )
}

export function hasUnclaimedReleasedOddityNodes(unclaimed: UnclaimedOddityNodes): boolean {
  return RELEASED_ODDITY_BOARD.some((region) => (unclaimed[region.key]?.length ?? 0) > 0)
}

export function oddityEnduranceTotal(unclaimed: UnclaimedOddityNodes | undefined): number {
  return oddityBoardTotals(unclaimed).endurance ?? 0
}
