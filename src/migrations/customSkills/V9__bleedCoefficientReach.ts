// v8 → v9 — the bleed rows gained a class buff for the Strategic Sword power
// coefficient talent, and Blood Burst gained the tag that lets a DoT-scoped
// inner-way bonus reach it. A Skill Editor copy seeded before that lists
// neither. Appended rather than overwritten: a user cannot have removed an
// entry that did not yet exist, so there is no deliberate edit to preserve.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const BLEED_TICK_ID = "bellstrikeUmbra-bleed-tick"
const BLEED_DETONATION_ID = "bellstrikeUmbra-bleed-detonation"
const BLEED_COEFFICIENT_BUFF_ID = "bellstrikeUmbraBleedCoefficient"
const EMPOWERED_DOT_TAG = "prop:empoweredDotEffect"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withEntry(list: unknown, entry: string): unknown {
  if (!Array.isArray(list) || list.includes(entry)) return list
  return [...list, entry]
}

export function healBleedCoefficientReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === BLEED_TICK_ID) {
    return { ...skill, receives: withEntry(skill.receives, BLEED_COEFFICIENT_BUFF_ID) }
  }
  if (skill.id === BLEED_DETONATION_ID) {
    return {
      ...skill,
      receives: withEntry(skill.receives, BLEED_COEFFICIENT_BUFF_ID),
      tags: withEntry(skill.tags, EMPOWERED_DOT_TAG),
    }
  }
  return skill
}

export const V9__bleedCoefficientReach: CustomSkillMigration = {
  to: 9,
  name: "V9__bleedCoefficientReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healBleedCoefficientReach)
      : blob.skills
    return { ...blob, v: 9, skills }
  },
}
