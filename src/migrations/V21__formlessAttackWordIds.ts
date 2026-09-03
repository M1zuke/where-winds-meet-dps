// v20 → v21 — the Formless attack pair kept the id `minVoidAttack` /
// `maxVoidAttack` from the label it carried before the game renamed it. The
// stat line now authors `minFormless` / `maxFormless`; a stored word at the old
// id is outside the catalogue, and the loader's word repair clears it to an
// empty roll.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_FORMLESS_WORD_IDS: Readonly<Record<string, string>> = {
  minVoidAttack: "minFormless",
  maxVoidAttack: "maxFormless",
}

export function migrateFormlessWordId(storedWord: string): string {
  return LEGACY_FORMLESS_WORD_IDS[storedWord] ?? storedWord
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function migratePieceWords(piece: unknown): unknown {
  if (!isRec(piece) || !Array.isArray(piece.words)) return piece
  const words = piece.words.map((entry) =>
    isRec(entry) && typeof entry.word === "string"
      ? { ...entry, word: migrateFormlessWordId(entry.word) }
      : entry,
  )
  return { ...piece, words }
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(inputs.inventory)) return inputs
  return { ...inputs, inventory: inputs.inventory.map(migratePieceWords) }
}

export const V21__formlessAttackWordIds: Migration = {
  to: 21,
  name: "V21__formlessAttackWordIds",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 21, profiles }
  },
}
