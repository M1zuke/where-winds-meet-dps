// v3 → v4 — the Bellstrike Umbra Smolder tick's coefficients were recalibrated
// to the mystic art's actual reachable rank. A Skill Editor copy seeded before
// that still holds the old per-tick row. Only a copy still identical to what
// was seeded is rewritten: once a value differs, a stale copy and a deliberate
// edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const UMBRA_SMOLDER_DEBUFF_ID = "debuff-bellstrikeUmbra-dark-fire"
const OLD_TICK = { physMultiplier: 0.236, physFixed: 44, attributeMultiplier: 0.354 }
const NEW_TICK = { physMultiplier: 0.24991, physFixed: 37.74, attributeMultiplier: 0.374865 }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateUmbraSmolderDot(id: string, dot: unknown): unknown {
  if (id !== UMBRA_SMOLDER_DEBUFF_ID || !isRecord(dot)) return dot
  const untouched =
    dot.physMultiplier === OLD_TICK.physMultiplier &&
    dot.physFixed === OLD_TICK.physFixed &&
    dot.attributeMultiplier === OLD_TICK.attributeMultiplier
  return untouched ? { ...dot, ...NEW_TICK } : dot
}

export const V4__umbraSmolderTick: CustomDebuffMigration = {
  to: 4,
  name: "V4__umbraSmolderTick",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map((debuff) =>
          isRecord(debuff) && typeof debuff.id === "string"
            ? { ...debuff, dot: migrateUmbraSmolderDot(debuff.id, debuff.dot) }
            : debuff,
        )
      : blob.debuffs
    return { ...blob, v: 4, debuffs }
  },
}
