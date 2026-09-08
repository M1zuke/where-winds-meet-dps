// v22 -> v23 — the game spells this set "Hawkwing"; "Hawking" never existed.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_SET_ID = "hawking"
const HAWKWING_SET_ID = "hawkwing"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateHawkingSetId(rawSet: unknown): unknown {
  return rawSet === LEGACY_SET_ID ? HAWKWING_SET_ID : rawSet
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  return { ...inputs, set: migrateHawkingSetId(inputs.set) }
}

export const V23__renameHawking: Migration = {
  to: 23,
  name: "V23__renameHawking",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 23, profiles }
  },
}
