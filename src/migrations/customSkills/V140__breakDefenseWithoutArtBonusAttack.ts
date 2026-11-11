// v139 → v140 — Heng Blade - Break Defense takes no martial-art additional
// attack: its skill class carries no martial-art bonus in game. A Skill Editor
// copy seeded before this still lists the Snowparting Blade bonus in its reach.
// The id is dropped from that copy's reach and nothing else is touched, so
// edited values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const BREAK_DEFENSE_SKILL_ID = "stonesplitStrength-break-defense"
const REMOVED_BUFF_ID = "snowpartingBladeAdditionalAttack"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== BREAK_DEFENSE_SKILL_ID) return skill
  if (!Array.isArray(skill.receives) || !skill.receives.includes(REMOVED_BUFF_ID)) return skill
  return { ...skill, receives: skill.receives.filter((buffId) => buffId !== REMOVED_BUFF_ID) }
}

export const V140__breakDefenseWithoutArtBonusAttack: CustomSkillMigration = {
  to: 140,
  name: "V140__breakDefenseWithoutArtBonusAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 140, skills }
  },
}
