// v133 → v134 — Ghostly Afterimage is fired from the dodge's own graph and carries
// the dodge-context tag: the drawn weapon's damage line and flat-bonus ranks
// reach it, All Mystic does not. A Skill Editor copy seeded before this has no
// tag and keeps scoring it as a plain mystic hit. The tag is added to every copy
// and nothing else is touched, so edited values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const AFTERIMAGE_ID = "mystic-ghostly-afterimage"
const DODGE_CONTEXT_TAG = "context:dodge"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== AFTERIMAGE_ID) return skill
  const tags: unknown[] = Array.isArray(skill.tags) ? skill.tags : []
  if (tags.includes(DODGE_CONTEXT_TAG)) return skill
  return { ...skill, tags: [...tags, DODGE_CONTEXT_TAG] }
}

export const V134__ghostlyAfterimageDodgeContext: CustomSkillMigration = {
  to: 134,
  name: "V134__ghostlyAfterimageDodgeContext",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 134, skills }
  },
}
