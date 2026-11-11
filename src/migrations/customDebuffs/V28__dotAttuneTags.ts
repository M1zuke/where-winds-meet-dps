// v27 → v28 — the previous shape stored one `dot.attuneTag` string; a hit may now
// carry several attunement tags. The seeded drone copies took one tag, and the
// game gives the drone's hit both the Frequent Projectile and the Special line,
// so a drone copy holding one of the retired single tags takes both.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const DRONE_STORED_TAGS = new Set([
  "attune:umbFrequentProjectile",
  "attune:umbSpecial",
  "attune:umbCharged",
])
const DRONE_TAGS = ["attune:umbFrequentProjectile", "attune:umbSpecial"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDotAttuneTag(debuff: unknown): unknown {
  if (!isRecord(debuff) || !isRecord(debuff.dot) || !("attuneTag" in debuff.dot)) return debuff
  const { attuneTag, ...dot } = debuff.dot
  if (typeof attuneTag !== "string" || attuneTag === "") return { ...debuff, dot }
  const isSeededDrone =
    typeof debuff.id === "string" &&
    DRONE_DEBUFF_ID.test(debuff.id) &&
    DRONE_STORED_TAGS.has(attuneTag)
  return { ...debuff, dot: { ...dot, attuneTags: isSeededDrone ? [...DRONE_TAGS] : [attuneTag] } }
}

export const V28__dotAttuneTags: CustomDebuffMigration = {
  to: 28,
  name: "V28__dotAttuneTags",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healDotAttuneTag) : blob.debuffs
    return { ...blob, v: 28, debuffs }
  },
}
