// v33 → v34 — Hero's Blood - Inebriate's Abrasion immunity is no longer an
// always-on skill flag: it now reads a build-level Binge Points threshold
// instead, reached the same way every other stat effect on this skill is, via
// `receives`. A Skill Editor copy seeded before this still carries the old
// unconditional flag and misses the new receives entry.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const HEROS_BLOOD_INEBRIATE_ID = "bamboocutDraught-heros-blood-inebriate"

const RECEIVES_BEFORE_NO_ABRASION = [
  "eonpourInebriateDamage",
  "inebriateSkillCritDamage",
  "drunkslayEcho",
  "volutefitWineboundDamage",
  "tiltrimInebriateBonus",
  "rivenTwinbladesAdditionalAttack",
  "cloudvault",
  "nonPlayerBaseDamage50",
]

function isUntouchedSeededReceives(receives: unknown): receives is string[] {
  return (
    Array.isArray(receives) &&
    receives.length === RECEIVES_BEFORE_NO_ABRASION.length &&
    RECEIVES_BEFORE_NO_ABRASION.every((id, index) => receives[index] === id)
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== HEROS_BLOOD_INEBRIATE_ID) return skill
  const next = { ...skill }
  if (next.neverAbrades === true) delete next.neverAbrades
  if (isUntouchedSeededReceives(next.receives))
    next.receives = [...next.receives, "herosBloodInebriateNoAbrasion"]
  return next
}

export const V34__herosBloodInebriateConditionalNoAbrasion: CustomSkillMigration = {
  to: 34,
  name: "V34__herosBloodInebriateConditionalNoAbrasion",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 34, skills }
  },
}
