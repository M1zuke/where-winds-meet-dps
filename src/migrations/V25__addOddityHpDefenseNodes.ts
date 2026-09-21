// v24 → v25 — Oddities gained Max HP and Physical Defense nodes alongside the
// attack ones this app already modelled; a stored region only gains the node
// ids it does not have yet, every other stored node staying exactly as is.
// The table below is the node set as it stood at v25 — the shape this migration
// is specified against, which later data changes must not move.
import type { Migration, RawProfilesBlob } from "./types"

interface LegacyOddityNode {
  id: number
  stat: "maxHp" | "physDef"
  value: number
}

const ADDED_NODES: Readonly<Record<string, readonly LegacyOddityNode[]>> = {
  Qinghe: [
    { id: 102, stat: "maxHp", value: 150 },
    { id: 107, stat: "maxHp", value: 150 },
    { id: 108, stat: "maxHp", value: 150 },
    { id: 110, stat: "maxHp", value: 150 },
    { id: 117, stat: "maxHp", value: 150 },
    { id: 123, stat: "maxHp", value: 150 },
    { id: 128, stat: "maxHp", value: 150 },
    { id: 141, stat: "maxHp", value: 150 },
    { id: 151, stat: "maxHp", value: 150 },
    { id: 152, stat: "maxHp", value: 150 },
    { id: 104, stat: "physDef", value: 2 },
    { id: 106, stat: "physDef", value: 2 },
    { id: 111, stat: "physDef", value: 2 },
    { id: 124, stat: "physDef", value: 2 },
    { id: 127, stat: "physDef", value: 2 },
    { id: 136, stat: "physDef", value: 2 },
  ],
  Kaifeng: [
    { id: 200, stat: "maxHp", value: 150 },
    { id: 204, stat: "maxHp", value: 150 },
    { id: 206, stat: "maxHp", value: 150 },
    { id: 207, stat: "maxHp", value: 150 },
    { id: 209, stat: "maxHp", value: 150 },
    { id: 211, stat: "maxHp", value: 150 },
    { id: 214, stat: "maxHp", value: 150 },
    { id: 215, stat: "maxHp", value: 150 },
    { id: 219, stat: "maxHp", value: 150 },
    { id: 223, stat: "maxHp", value: 150 },
    { id: 227, stat: "maxHp", value: 150 },
    { id: 232, stat: "maxHp", value: 150 },
    { id: 237, stat: "maxHp", value: 150 },
    { id: 238, stat: "maxHp", value: 150 },
    { id: 240, stat: "maxHp", value: 150 },
    { id: 245, stat: "maxHp", value: 150 },
    { id: 201, stat: "physDef", value: 2 },
    { id: 208, stat: "physDef", value: 2 },
    { id: 218, stat: "physDef", value: 2 },
    { id: 225, stat: "physDef", value: 2 },
    { id: 228, stat: "physDef", value: 2 },
    { id: 236, stat: "physDef", value: 2 },
    { id: 248, stat: "physDef", value: 2 },
    { id: 252, stat: "physDef", value: 2 },
  ],
  Hexi: [
    { id: 300, stat: "maxHp", value: 150 },
    { id: 304, stat: "maxHp", value: 150 },
    { id: 310, stat: "maxHp", value: 150 },
    { id: 315, stat: "maxHp", value: 150 },
    { id: 320, stat: "maxHp", value: 150 },
    { id: 326, stat: "maxHp", value: 150 },
    { id: 327, stat: "maxHp", value: 150 },
    { id: 329, stat: "maxHp", value: 150 },
    { id: 332, stat: "maxHp", value: 150 },
    { id: 336, stat: "maxHp", value: 150 },
    { id: 337, stat: "maxHp", value: 150 },
    { id: 309, stat: "physDef", value: 2 },
    { id: 311, stat: "physDef", value: 2 },
    { id: 323, stat: "physDef", value: 2 },
    { id: 325, stat: "physDef", value: 2 },
    { id: 335, stat: "physDef", value: 2 },
  ],
  "Kaifeng Palace": [
    { id: 500, stat: "maxHp", value: 100 },
    { id: 505, stat: "maxHp", value: 100 },
    { id: 508, stat: "maxHp", value: 100 },
    { id: 514, stat: "maxHp", value: 100 },
    { id: 518, stat: "maxHp", value: 100 },
    { id: 502, stat: "physDef", value: 2 },
    { id: 511, stat: "physDef", value: 2 },
  ],
  "Hidden Mountain: Suixiang": [
    { id: 400, stat: "maxHp", value: 150 },
    { id: 404, stat: "maxHp", value: 150 },
    { id: 405, stat: "maxHp", value: 150 },
    { id: 410, stat: "maxHp", value: 150 },
    { id: 413, stat: "maxHp", value: 150 },
    { id: 419, stat: "maxHp", value: 150 },
    { id: 420, stat: "maxHp", value: 150 },
    { id: 424, stat: "maxHp", value: 150 },
    { id: 425, stat: "maxHp", value: 150 },
    { id: 427, stat: "maxHp", value: 150 },
    { id: 428, stat: "maxHp", value: 150 },
    { id: 432, stat: "maxHp", value: 150 },
    { id: 436, stat: "maxHp", value: 150 },
    { id: 437, stat: "maxHp", value: 150 },
    { id: 409, stat: "physDef", value: 2 },
    { id: 411, stat: "physDef", value: 2 },
    { id: 426, stat: "physDef", value: 2 },
    { id: 435, stat: "physDef", value: 2 },
  ],
}

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function addMissingOddityNodes(oddities: unknown): unknown {
  if (!isRec(oddities)) return oddities
  const next: Record<string, unknown> = { ...oddities }
  for (const [region, defNodes] of Object.entries(ADDED_NODES)) {
    const stored = next[region]
    if (!Array.isArray(stored)) continue
    const existingIds = new Set(
      stored
        .filter(isRec)
        .map((node) => node.id)
        .filter((id): id is number => typeof id === "number"),
    )
    const missing = defNodes.filter((defNode) => !existingIds.has(defNode.id))
    if (missing.length === 0) continue
    next[region] = [...stored, ...missing.map((defNode) => ({ ...defNode, enabled: true }))]
  }
  return next
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
