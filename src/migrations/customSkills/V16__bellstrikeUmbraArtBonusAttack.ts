// v15 → v16 — every Bellstrike Umbra skill of an art now carries that art's
// Additional Attack Up buff. A Skill Editor copy seeded before that lists
// neither. Appended rather than overwritten: a user cannot have removed an
// entry that did not yet exist, so there is no deliberate edit to preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const CLASS_ID = "bellstrikeUmbra"
const SWORD_WEAPON_TAG = "weapon:Sword"
const SPEAR_WEAPON_TAG = "weapon:Spear"
const SWORD_BUFF_ID = "strategicSwordAdditionalAttack"
const SPEAR_BUFF_ID = "heavenquakerSpearAdditionalAttack"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withEntry(list: unknown, entry: string): unknown {
  if (list === undefined) return [entry]
  if (!Array.isArray(list) || list.includes(entry)) return list
  return [...list, entry]
}

export function healBellstrikeUmbraArtBonusAttack(skill: unknown): unknown {
  if (!isRecord(skill) || skill.classId !== CLASS_ID || !Array.isArray(skill.tags)) return skill
  if (skill.tags.includes(SWORD_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, SWORD_BUFF_ID) }
  }
  if (skill.tags.includes(SPEAR_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, SPEAR_BUFF_ID) }
  }
  return skill
}

export const V16__bellstrikeUmbraArtBonusAttack: CustomSkillMigration = {
  to: 16,
  name: "V16__bellstrikeUmbraArtBonusAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healBellstrikeUmbraArtBonusAttack)
      : blob.skills
    return { ...blob, v: 16, skills }
  },
}
