// v18 → v19 — every Bamboocut Draught skill of an art now carries that art's
// Additional Attack Up buff, and Falcon's Pursuit additionally carries the
// Skystrike Gauntlets coefficient clause. A Skill Editor copy seeded before
// that lists none of them. Appended rather than overwritten: a user cannot
// have removed an entry that did not yet exist, so there is no deliberate
// edit to preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const CLASS_ID = "bamboocutDraught"
const GAUNTLETS_WEAPON_TAG = "weapon:Gauntlets"
const TWIN_BLADES_WEAPON_TAG = "weapon:Twin Blades"
const GAUNTLETS_BUFF_ID = "skystrikeGauntletsAdditionalAttack"
const TWIN_BLADES_BUFF_ID = "rivenTwinbladesAdditionalAttack"
const FALCONS_PURSUIT_ID = "bamboocutDraught-falcons-pursuit"
const FALCONS_PURSUIT_COEFFICIENT_BUFF_ID = "skystrikeGauntletsAdditionalAttackCoefficient"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withEntry(list: unknown, entry: string): unknown {
  if (list === undefined) return [entry]
  if (!Array.isArray(list) || list.includes(entry)) return list
  return [...list, entry]
}

export function healBamboocutDraughtArtBonusAttack(skill: unknown): unknown {
  if (!isRecord(skill) || skill.classId !== CLASS_ID || !Array.isArray(skill.tags)) return skill
  if (skill.tags.includes(GAUNTLETS_WEAPON_TAG)) {
    const receives = withEntry(skill.receives, GAUNTLETS_BUFF_ID)
    if (skill.id !== FALCONS_PURSUIT_ID) return { ...skill, receives }
    return { ...skill, receives: withEntry(receives, FALCONS_PURSUIT_COEFFICIENT_BUFF_ID) }
  }
  if (skill.tags.includes(TWIN_BLADES_WEAPON_TAG)) {
    return { ...skill, receives: withEntry(skill.receives, TWIN_BLADES_BUFF_ID) }
  }
  return skill
}

export const V19__bamboocutDraughtArtBonusAttack: CustomSkillMigration = {
  to: 19,
  name: "V19__bamboocutDraughtArtBonusAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healBamboocutDraughtArtBonusAttack)
      : blob.skills
    return { ...blob, v: 19, skills }
  },
}
