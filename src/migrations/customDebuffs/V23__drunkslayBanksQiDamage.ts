// v22 → v23 — Drunkslay banks 12% of the Qi damage of every hit it feeds on
// next to the 20% of damage, and the release lands both. A Skill Editor copy
// seeded before this carries only the damage share. Only an echo still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRUNKSLAY_ID = "debuff-bamboocutDraught-drunkslay"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDrunkslayQiShare(debuff: unknown): unknown {
  if (!isRecord(debuff) || debuff.id !== DRUNKSLAY_ID || !isRecord(debuff.echo)) return debuff
  const { echo } = debuff
  if (echo.share !== 0.2 || "qiShare" in echo) return debuff
  return { ...debuff, echo: { ...echo, qiShare: 0.12 } }
}

export const V23__drunkslayBanksQiDamage: CustomDebuffMigration = {
  to: 23,
  name: "V23__drunkslayBanksQiDamage",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDrunkslayQiShare)
      : blob.debuffs
    return { ...blob, v: 23, debuffs }
  },
}
