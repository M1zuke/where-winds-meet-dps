// v17 → v18 — a floating umbrella projectile that refreshes Lingering Bone also
// refreshes Star Reacher's window, and Silkbind Jade never applies Soul-Shaken,
// so neither the umbrella nor the Bitter Season tick lists it as a buff it
// receives. A Skill Editor copy seeded before this still carries the old lists.
// A list is rewritten only while it is identical to what was seeded: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const BITTER_SEASON_TICK_ID = "debuff-silkbindJade-bitter-season-tick"

const TRIGGERS_BEFORE = ["lingeringBone"]
const TRIGGERS_AFTER = ["lingeringBone", "starReacherSupreme", "starReacher"]
const DRONE_RECEIVES_BEFORE = ["soulShaken", "lingeringBone", "comboExtendMark"]
const DRONE_RECEIVES_AFTER = ["lingeringBone", "comboExtendMark"]
const BITTER_SEASON_RECEIVES_BEFORE = ["soulShaken"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameList = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry)

export function healJadeDebuff(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (debuff.id === BITTER_SEASON_TICK_ID)
    return sameList(debuff.receives, BITTER_SEASON_RECEIVES_BEFORE)
      ? { ...debuff, receives: [] }
      : debuff
  if (!DRONE_DEBUFF_ID.test(debuff.id)) return debuff
  return {
    ...debuff,
    ...(sameList(debuff.triggersBuffs, TRIGGERS_BEFORE)
      ? { triggersBuffs: [...TRIGGERS_AFTER] }
      : {}),
    ...(sameList(debuff.receives, DRONE_RECEIVES_BEFORE)
      ? { receives: [...DRONE_RECEIVES_AFTER] }
      : {}),
  }
}

export const V18__jadeDroneStarReacherGrantsAndNoSoulShaken: CustomDebuffMigration = {
  to: 18,
  name: "V18__jadeDroneStarReacherGrantsAndNoSoulShaken",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs) ? blob.debuffs.map(healJadeDebuff) : blob.debuffs
    return { ...blob, v: 18, debuffs }
  },
}
