// v49 → v50 — the falcon and the Anxi Army assist family join Etherwrath's
// 5-stack attribute-penetration reach. A Skill Editor copy seeded before this
// still lacks it.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const TARGET_SKILL_IDS = new Set([
  "bamboocutDraught-falcons-pursuit",
  "stonesplitStrength-anxisoldierheng",
  "stonesplitStrength-anxisoldiermodown",
  "stonesplitStrength-anxisoldiermojump",
  "stonesplitStrength-anxisoldiermosweep",
])

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !TARGET_SKILL_IDS.has(skill.id))
    return skill
  const existing = Array.isArray(skill.receives) ? skill.receives : []
  if (existing.includes("etherwrathPenetrationBoost")) return skill
  return { ...skill, receives: [...existing, "etherwrathPenetrationBoost"] }
}

export const V50__etherwrathPenetrationReach: CustomSkillMigration = {
  to: 50,
  name: "V50__etherwrathPenetrationReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 50, skills }
  },
}
