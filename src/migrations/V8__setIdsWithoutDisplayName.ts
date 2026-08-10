// v7 → v8 — `Inputs.set` stops storing the set's display name and stores a
// stable id instead (`src/data/sets/`), distinct from the name the UI shows.
// The name list is frozen here rather than read from `src/data/sets/`: this
// step is a one-time hop, so a later rename needs its own step. An
// unrecognised or absent value degrades to no set rather than throwing.
import type { Migration, RawProfilesBlob } from "./types"

export const LEGACY_SET_NAME_TO_ID: Record<string, string> = {
  Hawking: "hawking",
  Jadeware: "jadeware",
  Rainwhisper: "rainwhisper",
  "Rainwhisper (no shield)": "rainwhisperNoShield",
  Ivorybloom: "ivorybloom",
  Swallowcall: "swallowcall",
  "Swift Gale": "swiftGale",
  "Swaying Heights": "swayingHeights",
  Mistwillow: "mistwillow",
  "Stars Align": "starsAlign",
  "Shattered Ridge": "shatteredRidge",
}

const VALID_SET_IDS = new Set(Object.values(LEGACY_SET_NAME_TO_ID))

export function migrateSetId(rawSet: unknown): string | null {
  if (typeof rawSet !== "string" || !rawSet) return null
  if (VALID_SET_IDS.has(rawSet)) return rawSet
  return LEGACY_SET_NAME_TO_ID[rawSet] ?? null
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const V8__setIdsWithoutDisplayName: Migration = {
  to: 8,
  name: "V8__setIdsWithoutDisplayName",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: { ...profile.inputs, set: migrateSetId(profile.inputs.set) } }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 8, profiles }
  },
}
