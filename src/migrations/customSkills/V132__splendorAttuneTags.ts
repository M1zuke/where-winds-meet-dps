// v131 → v132 — the previous shape tagged Splendor's martial-art, special and
// spear-charged skills with the weapon-shaped `attune:swordQ`, `attune:swordSpecial`
// and `attune:spearCharged`, shared with Umbra. A copy's own attune tag masks the
// built-in one, so a stored Splendor copy keeps the shared tag until it is renamed
// here. The rename keeps its meaning, so seeded copies and user-authored skills
// are treated alike.
import { migrateSplendorAttuneTag } from "../V35__splendorAttunementIds"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || !Array.isArray(skill.tags)) return skill
  const stored: unknown[] = skill.tags
  const tags = stored.map((tag) =>
    typeof tag === "string" ? migrateSplendorAttuneTag(skill.classId, tag) : tag,
  )
  return tags.some((tag, index) => tag !== stored[index]) ? { ...skill, tags } : skill
}

export const V132__splendorAttuneTags: CustomSkillMigration = {
  to: 132,
  name: "V132__splendorAttuneTags",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 132, skills }
  },
}
