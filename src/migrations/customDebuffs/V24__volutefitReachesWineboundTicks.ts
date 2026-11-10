// v23 → v24 — Volutefit's Winebound damage also reaches the Combustion and
// Smolder ticks. A Skill Editor copy seeded before this still lacks the buff in
// its receives list. Only a list still identical to what was seeded is
// extended: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const TICK_IDS: ReadonlySet<string> = new Set(["debuff-mystic-combustion", "debuff-mystic-smolder"])
const SEEDED_RECEIVES = ["bellstrikeUmbraBleedingDamage", "soulShaken"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healWineboundTickReceives(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string" || !TICK_IDS.has(debuff.id)) return debuff
  const { receives } = debuff
  const seeded =
    Array.isArray(receives) &&
    receives.length === SEEDED_RECEIVES.length &&
    SEEDED_RECEIVES.every((entry, index) => receives[index] === entry)
  if (!seeded) return debuff
  return { ...debuff, receives: [...SEEDED_RECEIVES, "volutefitWineboundDamage"] }
}

export const V24__volutefitReachesWineboundTicks: CustomDebuffMigration = {
  to: 24,
  name: "V24__volutefitReachesWineboundTicks",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healWineboundTickReceives)
      : blob.debuffs
    return { ...blob, v: 24, debuffs }
  },
}
