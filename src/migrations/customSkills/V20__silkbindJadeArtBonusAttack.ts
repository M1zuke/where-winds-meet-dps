// v19 → v20 — every Silkbind Jade skill of an art now carries that art's
// Additional Attack Up buff. A Skill Editor copy seeded before that lists
// neither. Appended rather than overwritten: a user cannot have removed an
// entry that did not yet exist, so there is no deliberate edit to preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const CLASS_ID = "silkbindJade"
const FAN_WEAPON_TAG = "weapon:Fan"
const UMBRELLA_WEAPON_TAG = "weapon:Umbrella"
const FAN_BUFF_ID = "inkwellFanAdditionalAttack"
const UMBRELLA_BUFF_ID = "vernalUmbrellaAdditionalAttack"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withEntry(list: unknown, entry: string): unknown {
  if (list === undefined) return [entry]
  if (!Array.isArray(list) || list.includes(entry)) return list
  return [...list, entry]
}

export function healSilkbindJadeArtBonusAttack(skill: unknown): unknown {
  if (!isRecord(skill) || skill.classId !== CLASS_ID || !Array.isArray(skill.tags)) return skill
  if (skill.tags.includes(FAN_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, FAN_BUFF_ID) }
  }
  if (skill.tags.includes(UMBRELLA_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, UMBRELLA_BUFF_ID) }
  }
  return skill
}

export const V20__silkbindJadeArtBonusAttack: CustomSkillMigration = {
  to: 20,
  name: "V20__silkbindJadeArtBonusAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healSilkbindJadeArtBonusAttack)
      : blob.skills
    return { ...blob, v: 20, skills }
  },
}
