// v34 → v35 — the previous shape stored one attunement id per weapon role for
// both Bellstrike arts: `swordQ`, `swordSpecial` and `spearCharged` named the
// Splendor line as well as the Umbra one. A Splendor profile's piece holding one
// of them was scored as Splendor's line. The ids a Splendor piece may hold are now
// its own, and the rename depends on the profile's class, so it runs here once —
// a per-load rename would convert a real Umbra roll the moment a profile is
// switched to Splendor.
import type { Migration, RawProfilesBlob } from "./types"

const SPLENDOR_CLASS_ID = "bellstrikeSplendor"
const ATTUNE_PREFIX = "attune:"

export const SPLENDOR_ATTUNEMENT_RENAMES: Readonly<Record<string, string>> = {
  swordQ: "namelessSwordQ",
  swordSpecial: "namelessSwordSpecial",
  spearCharged: "namelessSpearCharged",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function migrateSplendorAttunementId(classId: unknown, id: string): string {
  if (classId !== SPLENDOR_CLASS_ID) return id
  return Object.hasOwn(SPLENDOR_ATTUNEMENT_RENAMES, id) ? SPLENDOR_ATTUNEMENT_RENAMES[id] : id
}

export function migrateSplendorAttuneTag(classId: unknown, tag: string): string {
  if (!tag.startsWith(ATTUNE_PREFIX)) return tag
  return ATTUNE_PREFIX + migrateSplendorAttunementId(classId, tag.slice(ATTUNE_PREFIX.length))
}

export function splitSplendorAttunements(inputs: unknown): unknown {
  if (!isRecord(inputs) || inputs.classId !== SPLENDOR_CLASS_ID) return inputs
  const inventory = inputs.inventory
  if (!Array.isArray(inventory)) return inputs
  let changed = false
  const renamed = inventory.map((piece) => {
    if (!isRecord(piece) || typeof piece.attunement !== "string") return piece
    const attunement = migrateSplendorAttunementId(inputs.classId, piece.attunement)
    if (attunement === piece.attunement) return piece
    changed = true
    return { ...piece, attunement }
  })
  return changed ? { ...inputs, inventory: renamed } : inputs
}

export const V35__splendorAttunementIds: Migration = {
  to: 35,
  name: "V35__splendorAttunementIds",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRecord(profile) && isRecord(profile.inputs)
            ? { ...profile, inputs: splitSplendorAttunements(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 35, profiles }
  },
}
