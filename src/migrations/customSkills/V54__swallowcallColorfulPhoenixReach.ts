// v53 → v54 — Umb HeavyLight (Colorful Phoenix's own share of the module) now
// carries the Swallowcall Light Attack reach. A Skill Editor copy seeded
// before this still lacks it.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const TARGET_SKILL_ID = "silkbindJade-umb-heavylight"
const RECEIVE_ID = "swallowcallLightAttackBoost"

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== TARGET_SKILL_ID) return skill
  const existing = Array.isArray(skill.receives) ? skill.receives : []
  if (existing.includes(RECEIVE_ID)) return skill
  return { ...skill, receives: [RECEIVE_ID, ...existing] }
}

export const V54__swallowcallColorfulPhoenixReach: CustomSkillMigration = {
  to: 54,
  name: "V54__swallowcallColorfulPhoenixReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 54, skills }
  },
}
