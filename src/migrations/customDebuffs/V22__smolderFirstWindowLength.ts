// v21 → v22 — Smolder's first window lasts 234 frames (was 240); every further
// hit still extends it by 240. A Skill Editor copy seeded before this still
// carries 240. Only a value still identical to what was seeded is rewritten:
// once it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const SMOLDER_ID = "debuff-mystic-smolder"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSmolderWindowLength(debuff: unknown): unknown {
  if (!isRecord(debuff) || debuff.id !== SMOLDER_ID || debuff.durationFrames !== 240) return debuff
  return { ...debuff, durationFrames: 234 }
}

export const V22__smolderFirstWindowLength: CustomDebuffMigration = {
  to: 22,
  name: "V22__smolderFirstWindowLength",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healSmolderWindowLength)
      : blob.debuffs
    return { ...blob, v: 22, debuffs }
  },
}
