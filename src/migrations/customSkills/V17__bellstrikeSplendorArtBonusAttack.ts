// v16 → v17 — every Bellstrike Splendor skill of an art now carries that
// art's Additional Attack Up buff. A Skill Editor copy seeded before that
// lists neither. Appended rather than overwritten: a user cannot have removed
// an entry that did not yet exist, so there is no deliberate edit to
// preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const CLASS_ID = "bellstrikeSplendor"
const SWORD_WEAPON_TAG = "weapon:Sword"
const SPEAR_WEAPON_TAG = "weapon:Spear"
const SWORD_BUFF_ID = "namelessSwordAdditionalAttack"
const SPEAR_BUFF_ID = "namelessSpearAdditionalAttack"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withEntry(list: unknown, entry: string): unknown {
  if (list === undefined) return [entry]
  if (!Array.isArray(list) || list.includes(entry)) return list
  return [...list, entry]
}

export function healBellstrikeSplendorArtBonusAttack(skill: unknown): unknown {
  if (!isRecord(skill) || skill.classId !== CLASS_ID || !Array.isArray(skill.tags)) return skill
  if (skill.tags.includes(SWORD_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, SWORD_BUFF_ID) }
  }
  if (skill.tags.includes(SPEAR_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, SPEAR_BUFF_ID) }
  }
  return skill
}

export const V17__bellstrikeSplendorArtBonusAttack: CustomSkillMigration = {
  to: 17,
  name: "V17__bellstrikeSplendorArtBonusAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healBellstrikeSplendorArtBonusAttack)
      : blob.skills
    return { ...blob, v: 17, skills }
  },
}
