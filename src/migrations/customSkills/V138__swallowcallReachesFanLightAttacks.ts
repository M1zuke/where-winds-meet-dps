// v137 → v138 — Swallowcall's Light Attack bonuses reach Silkbind Jade's Inkwell
// Fan Light Attack skills (the tap and the four-stage chain). A Skill Editor copy
// seeded before this does not list the buff in its reach. The buff is appended to
// every such copy and nothing else is touched, so edited values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SWALLOWCALL_BUFF_ID = "swallowcallLightAttackBoost"
const SKILL_IDS: readonly string[] = ["silkbindJade-fan-light", "silkbindJade-fan-light-chain"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !SKILL_IDS.includes(skill.id))
    return skill
  const receives: unknown[] = Array.isArray(skill.receives) ? skill.receives : []
  if (receives.includes(SWALLOWCALL_BUFF_ID)) return skill
  return { ...skill, receives: [...receives, SWALLOWCALL_BUFF_ID] }
}

export const V138__swallowcallReachesFanLightAttacks: CustomSkillMigration = {
  to: 138,
  name: "V138__swallowcallReachesFanLightAttacks",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 138, skills }
  },
}
