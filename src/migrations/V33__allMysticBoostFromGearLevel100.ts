// v32 → v33 — from gear level 100 a helm and a chestpiece roll All Mystic Skill
// DMG Boost in place of the single-target and area pair, and the game upgrades a
// piece holding either of the two. A stored piece at level 100 or above keeps its
// roll under the merged word; a lower piece keeps the word it has.
import type { Migration, RawProfilesBlob } from "./types"

const MERGED_FROM_LEVEL = 100
const MERGED_WORDS: ReadonlySet<string> = new Set(["singleTargetMysticBoost", "areaMysticBoost"])
const MERGED_INTO = "allMysticBoost"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function mergePieceMysticWords(piece: unknown): unknown {
  if (!isRecord(piece) || !Array.isArray(piece.words)) return piece
  if (typeof piece.level !== "number" || piece.level < MERGED_FROM_LEVEL) return piece
  if (!piece.words.some((entry) => isRecord(entry) && MERGED_WORDS.has(entry.word as string)))
    return piece
  const words = piece.words.map((entry) =>
    isRecord(entry) && MERGED_WORDS.has(entry.word as string)
      ? { ...entry, word: MERGED_INTO }
      : entry,
  )
  return { ...piece, words }
}

export function mergeMysticBoostWords(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(inputs.inventory)) return inputs
  return { ...inputs, inventory: inputs.inventory.map(mergePieceMysticWords) }
}

export const V33__allMysticBoostFromGearLevel100: Migration = {
  to: 33,
  name: "V33__allMysticBoostFromGearLevel100",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRecord(profile) && isRecord(profile.inputs)
            ? { ...profile, inputs: mergeMysticBoostWords(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 33, profiles }
  },
}
