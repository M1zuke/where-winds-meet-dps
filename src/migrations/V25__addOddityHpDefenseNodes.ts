// v24 → v25 — Oddities gained Max HP and Physical Defense nodes alongside the
// attack ones this app already modelled; a stored region only gains the node
// ids it does not have yet, every other stored node staying exactly as is.
import type { Migration, RawProfilesBlob } from "./types"
import type { OddityNode, OddityRegions } from "../engine/types"
import { DEFAULT_ODDITIES } from "../definitions/baseStats"

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function addMissingOddityNodes(oddities: unknown): unknown {
  if (!isRec(oddities)) return oddities
  const next: Record<string, unknown> = { ...oddities }
  for (const [region, defNodes] of Object.entries(DEFAULT_ODDITIES) as [string, OddityNode[]][]) {
    const stored = next[region]
    if (!Array.isArray(stored)) continue
    const existingIds = new Set(
      stored.filter(isRec).map((node) => node.id).filter((id): id is number => typeof id === "number"),
    )
    const missing = defNodes.filter((defNode) => !existingIds.has(defNode.id))
    if (missing.length === 0) continue
    next[region] = [...stored, ...missing.map((defNode) => ({ ...defNode }))]
  }
  return next as OddityRegions
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!("oddities" in inputs)) return inputs
  return { ...inputs, oddities: addMissingOddityNodes(inputs.oddities) }
}

export const V25__addOddityHpDefenseNodes: Migration = {
  to: 25,
  name: "V25__addOddityHpDefenseNodes",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 25, profiles }
  },
}
