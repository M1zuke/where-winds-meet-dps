// v16 → v17 — Bellstrike Splendor never applies Soul-Shaken, so its Bitter
// Season tick no longer lists it as a buff it receives. A Skill Editor copy
// seeded before this still lists it. Only a list still identical to what was
// seeded is rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const BITTER_SEASON_TICK_ID = "debuff-bellstrikeSplendor-bitter-season-tick"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healBitterSeasonTickReceives(debuff: unknown): unknown {
  if (!isRecord(debuff) || debuff.id !== BITTER_SEASON_TICK_ID) return debuff
  const receives = debuff.receives
  const seeded = Array.isArray(receives) && receives.length === 1 && receives[0] === "soulShaken"
  if (!seeded) return debuff
  return { ...debuff, receives: [] }
}

export const V17__splendorBitterSeasonTickWithoutSoulShaken: CustomDebuffMigration = {
  to: 17,
  name: "V17__splendorBitterSeasonTickWithoutSoulShaken",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healBitterSeasonTickReceives)
      : blob.debuffs
    return { ...blob, v: 17, debuffs }
  },
}
