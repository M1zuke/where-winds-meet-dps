// v5 → v6 — the Bleeding debuff gained a class buff for the Strategic Sword
// power coefficient talent. A Skill Editor copy seeded before that does not
// list it and scores its ticks without it. Appended rather than overwritten:
// a user cannot have removed an entry that did not yet exist.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const BLEED_TICK_DEBUFF_ID = "debuff-bellstrikeUmbra-bleed-tick"
const BLEED_COEFFICIENT_BUFF_ID = "bellstrikeUmbraBleedCoefficient"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healBleedCoefficientReceives(debuff: unknown): unknown {
  if (!isRecord(debuff) || debuff.id !== BLEED_TICK_DEBUFF_ID) return debuff
  const receives = debuff.receives
  if (!Array.isArray(receives) || receives.includes(BLEED_COEFFICIENT_BUFF_ID)) return debuff
  return { ...debuff, receives: [...receives, BLEED_COEFFICIENT_BUFF_ID] }
}

export const V6__bleedCoefficientReach: CustomDebuffMigration = {
  to: 6,
  name: "V6__bleedCoefficientReach",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healBleedCoefficientReceives)
      : blob.debuffs
    return { ...blob, v: 6, debuffs }
  },
}
