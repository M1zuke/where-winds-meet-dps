// v14 → v15 — Combo - Extend Mark is no longer granted by a drone tick: every
// tick reaches it through the debuff's receives instead. A Skill Editor copy
// seeded before this still lists it as a granted buff and lacks the receives
// entry. Each list is rewritten only while it still equals what was seeded:
// once it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const EXTEND_MARK_ID = "comboExtendMark"
const SEEDED_TRIGGERS_BUFFS = ["lingeringBone", EXTEND_MARK_ID]
const SEEDED_RECEIVES = ["soulShaken", "lingeringBone"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const equalsList = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry)

export function healDroneComboExtendMarkPerHit(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!DRONE_DEBUFF_ID.test(debuff.id)) return debuff
  return {
    ...debuff,
    ...(equalsList(debuff.triggersBuffs, SEEDED_TRIGGERS_BUFFS)
      ? { triggersBuffs: SEEDED_TRIGGERS_BUFFS.filter((buffId) => buffId !== EXTEND_MARK_ID) }
      : {}),
    ...(equalsList(debuff.receives, SEEDED_RECEIVES)
      ? { receives: [...SEEDED_RECEIVES, EXTEND_MARK_ID] }
      : {}),
  }
}

export const V15__droneComboExtendMarkPerHit: CustomDebuffMigration = {
  to: 15,
  name: "V15__droneComboExtendMarkPerHit",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDroneComboExtendMarkPerHit)
      : blob.debuffs
    return { ...blob, v: 15, debuffs }
  },
}
