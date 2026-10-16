// v13 → v14 — every Umbrella Drone tick grants Combo - Extend Mark. A Skill
// Editor copy seeded before this still lists only Lingering Bone. Only a copy
// whose granted buffs are exactly that seeded list is rewritten: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone(-\d+hit)?$/
const SEEDED_TRIGGERS_BUFFS = ["lingeringBone"]
const EXTEND_MARK_ID = "comboExtendMark"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healDroneComboExtendMarkReach(debuff: unknown): unknown {
  if (!isRecord(debuff) || typeof debuff.id !== "string") return debuff
  if (!DRONE_DEBUFF_ID.test(debuff.id)) return debuff
  const { triggersBuffs } = debuff
  const seeded =
    Array.isArray(triggersBuffs) &&
    triggersBuffs.length === SEEDED_TRIGGERS_BUFFS.length &&
    SEEDED_TRIGGERS_BUFFS.every((buffId, index) => triggersBuffs[index] === buffId)
  if (!seeded) return debuff
  return { ...debuff, triggersBuffs: [...SEEDED_TRIGGERS_BUFFS, EXTEND_MARK_ID] }
}

export const V14__droneComboExtendMarkReach: CustomDebuffMigration = {
  to: 14,
  name: "V14__droneComboExtendMarkReach",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    const debuffs = Array.isArray(blob.debuffs)
      ? blob.debuffs.map(healDroneComboExtendMarkReach)
      : blob.debuffs
    return { ...blob, v: 14, debuffs }
  },
}
