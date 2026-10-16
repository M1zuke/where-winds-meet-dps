// The skills the floating umbrella's bullets and Spring Away's bullets take
// their damage from are direct weapon hits, not sustain ticks. A Skill Editor
// copy is retyped only while it still carries the type it was seeded with:
// once it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const BULLET_SKILL_ID = /^silkbindJade-(umbdrone(-\d+hit)?|umblightcharge(-12)?)$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !BULLET_SKILL_ID.test(skill.id))
    return skill
  return skill.skillType === "sustain" ? { ...skill, skillType: "weapon" } : skill
}

export const V93__jadeBulletSkillsAsWeaponHits: CustomSkillMigration = {
  to: 93,
  name: "V93__jadeBulletSkillsAsWeaponHits",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 93, skills }
  },
}
