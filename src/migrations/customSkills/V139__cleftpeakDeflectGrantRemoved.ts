// v138 → v139 — a deflect no longer grants Cleftpeak's stacks: the set's grant
// fires only when the wearer parries an attack, which no fight against a dummy
// contains. A Skill Editor copy seeded before this still lists the grant among
// what the cast triggers; the id is dropped from every copy's triggers and
// reach and nothing else is touched, so edited values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const REMOVED_BUFF_ID = "cleftpeakDeflectGrant"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const withoutRemovedBuff = (value: unknown): unknown =>
  Array.isArray(value) && value.includes(REMOVED_BUFF_ID)
    ? value.filter((buffId) => buffId !== REMOVED_BUFF_ID)
    : value

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill)) return skill
  const triggersBuffs = withoutRemovedBuff(skill.triggersBuffs)
  const receives = withoutRemovedBuff(skill.receives)
  if (triggersBuffs === skill.triggersBuffs && receives === skill.receives) return skill
  return { ...skill, triggersBuffs, receives }
}

export const V139__cleftpeakDeflectGrantRemoved: CustomSkillMigration = {
  to: 139,
  name: "V139__cleftpeakDeflectGrantRemoved",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 139, skills }
  },
}
