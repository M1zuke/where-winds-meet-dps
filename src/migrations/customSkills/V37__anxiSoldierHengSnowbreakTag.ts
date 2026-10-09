// v36 → v37 — the Heng soldier Snowbreak Spring calls carries Snowbreak
// Spring's own stack-family tag now, alongside the general Anxi soldier one,
// so it stacks Throat-Pierced below tier 6 too. A Skill Editor copy seeded
// before this still carries only the general tag.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const ANXI_SOLDIER_HENG_ID = "stonesplitStrength-anxisoldierheng"

const TAGS_BEFORE_SNOWBREAK = [
  "weapon:Heng Blade",
  "prop:cleftpeakBoost",
  "role:anxiSoldier",
  "attune:snowpartingVariedCombo",
]

function isUntouchedSeededTags(tags: unknown): tags is string[] {
  return (
    Array.isArray(tags) &&
    tags.length === TAGS_BEFORE_SNOWBREAK.length &&
    TAGS_BEFORE_SNOWBREAK.every((tag, index) => tags[index] === tag)
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== ANXI_SOLDIER_HENG_ID) return skill
  if (!isUntouchedSeededTags(skill.tags)) return skill
  return { ...skill, tags: [...skill.tags, "role:snowpartingVC"] }
}

export const V37__anxiSoldierHengSnowbreakTag: CustomSkillMigration = {
  to: 37,
  name: "V37__anxiSoldierHengSnowbreakTag",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 37, skills }
  },
}
