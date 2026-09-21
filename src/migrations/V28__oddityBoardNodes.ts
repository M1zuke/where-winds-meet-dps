// v27 → v28 — oddities were stored as a per-region list of node objects carrying
// their own stat, value and `enabled` flag. The board stores only the ids a
// profile has NOT claimed, so a stored node switched off becomes its id and the
// chain closes over it. The attack nodes were stored under placeholder ids 1..6,
// which stand for that region's attack nodes in order.
import type { Migration, RawProfilesBlob } from "./types"
import {
  closeUnclaimedOddityNodes,
  oddityNodeById,
  oddityRegionNodes,
} from "../definitions/baseStats"

type StoredNode = { id: number; stat?: string; enabled: boolean }

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function storedNodes(value: unknown): StoredNode[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRec).flatMap((node) => {
    if (typeof node.id !== "number") return []
    return [
      {
        id: node.id,
        stat: typeof node.stat === "string" ? node.stat : undefined,
        enabled: node.enabled !== false,
      },
    ]
  })
}

function attackIdsByStat(region: string): Map<string, number[]> {
  const byStat = new Map<string, number[]>()
  for (const node of oddityRegionNodes(region)) {
    if (node.stat !== "minPhys" && node.stat !== "maxPhys") continue
    const ids = byStat.get(node.stat)
    if (ids) ids.push(node.id)
    else byStat.set(node.stat, [node.id])
  }
  return byStat
}

export function unclaimedOddityNodesFromLegacy(oddities: unknown): Record<string, number[]> {
  if (!isRec(oddities)) return {}
  const out: Record<string, number[]> = {}
  for (const [region, value] of Object.entries(oddities)) {
    const nodes = storedNodes(value)
    if (nodes.length === 0) continue
    const attackIds = attackIdsByStat(region)
    const seenPerStat = new Map<string, number>()
    const unclaimed: number[] = []
    for (const node of nodes) {
      if (oddityNodeById(region, node.id)) {
        if (!node.enabled) unclaimed.push(node.id)
        continue
      }
      if (node.stat !== "minPhys" && node.stat !== "maxPhys") continue
      const index = seenPerStat.get(node.stat) ?? 0
      seenPerStat.set(node.stat, index + 1)
      const mapped = attackIds.get(node.stat)?.[index]
      if (mapped !== undefined && !node.enabled) unclaimed.push(mapped)
    }
    const closed = closeUnclaimedOddityNodes(region, unclaimed)
    if (closed.length > 0) out[region] = closed
  }
  return out
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!("oddities" in inputs)) return inputs
  const { oddities, ...rest } = inputs
  return { ...rest, unclaimedOddityNodes: unclaimedOddityNodesFromLegacy(oddities) }
}

export const V28__oddityBoardNodes: Migration = {
  to: 28,
  name: "V28__oddityBoardNodes",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 28, profiles }
  },
}
