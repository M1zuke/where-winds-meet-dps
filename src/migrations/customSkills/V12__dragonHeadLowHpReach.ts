// v11 → v12 — the low-HP damage bonus covers both Dragon Head variants in
// game, but only the Plus variant carried it. A Skill Editor copy of the base
// variant seeded before that fix still lists only Surging Wave's Might.
// Appended rather than overwritten: a user cannot have removed an entry that
// did not yet exist, so there is no deliberate edit to preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SEEDED_RECEIVES = ["surgingWaves"]
const LOW_HP_BUFF_ID = "dragonHeadLowHp"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isUntouchedSeededList = (list: unknown): boolean =>
  Array.isArray(list) &&
  list.length === SEEDED_RECEIVES.length &&
  list.every((entry, index) => entry === SEEDED_RECEIVES[index])

export function healDragonHeadLowHpReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (!skill.id.endsWith("-dragon-head")) return skill
  if (!isUntouchedSeededList(skill.receives)) return skill
  return { ...skill, receives: [...SEEDED_RECEIVES, LOW_HP_BUFF_ID] }
}

export const V12__dragonHeadLowHpReach: CustomSkillMigration = {
  to: 12,
  name: "V12__dragonHeadLowHpReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healDragonHeadLowHpReach)
      : blob.skills
    return { ...blob, v: 12, skills }
  },
}
