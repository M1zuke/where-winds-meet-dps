// v2 → v3 — the Bellstrike Umbra Bleeding tick was re-authored. A Skill
// Editor copy seeded before that still holds the old per-tick row. Only a copy
// still identical to what was seeded is rewritten: once a value differs, a
// stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const UMBRA_BLEED_DEBUFF_ID = "debuff-bellstrikeUmbra-bleed-tick"
const OLD_TICK = { physMultiplier: 0.06864, attributeMultiplier: 0.10296 }
const NEW_TICK = { physMultiplier: 0.066, attributeMultiplier: 0.099 }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateUmbraBleedDot(id: string, dot: unknown): unknown {
  if (id !== UMBRA_BLEED_DEBUFF_ID || !isRecord(dot)) return dot
  const untouched =
    dot.physMultiplier === OLD_TICK.physMultiplier &&
    dot.attributeMultiplier === OLD_TICK.attributeMultiplier
  return untouched ? { ...dot, ...NEW_TICK } : dot
}

export const V3__umbraBleedTick: CustomDebuffMigration = {
  to: 3,
  name: "V3__umbraBleedTick",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map((debuff) =>
          isRecord(debuff) && typeof debuff.id === "string"
            ? { ...debuff, dot: migrateUmbraBleedDot(debuff.id, debuff.dot) }
            : debuff,
        )
      : blob.debuffs
    return { ...blob, v: 3, debuffs }
  },
}
