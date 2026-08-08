// v6 → v7 — the Single-Target Mystic Skill DMG Boost max roll was corrected from
// 11 % to 9.797 % (in-game, 2026-08-08). A profile saved under the old cap can
// hold a value the new cap forbids, and `computeGearContribution` scales the
// word's effect by `value / amount` — so an over-cap value keeps over-counting
// with nothing in the UI showing it. The caps are frozen here rather than read
// from `itemRanking.ts`: this step is a one-time hop, so a later correction
// needs its own step.
import type { Migration, RawProfilesBlob } from "./types"

const WORD = "Single-Target Mystic Skill DMG Boost"
const MAX_ROLL = 0.09797
const RELAYED_MAX_ROLL = 0.092

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function clampPieceWords(piece: unknown): unknown {
  if (!isRec(piece) || !Array.isArray(piece.words)) return piece
  const cap = piece.relayed === true ? RELAYED_MAX_ROLL : MAX_ROLL
  let changed = false
  const words = piece.words.map((entry) => {
    if (!isRec(entry) || entry.word !== WORD) return entry
    if (typeof entry.value !== "number" || entry.value <= cap) return entry
    changed = true
    return { ...entry, value: cap }
  })
  return changed ? { ...piece, words } : piece
}

export const V7__clampSingleMysticWordRoll: Migration = {
  to: 7,
  name: "V7__clampSingleMysticWordRoll",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          const inventory = profile.inputs.inventory
          if (!Array.isArray(inventory)) return profile
          return {
            ...profile,
            inputs: { ...profile.inputs, inventory: inventory.map(clampPieceWords) },
          }
        })
      : blob.profiles
    return { ...blob, v: 7, profiles }
  },
}
