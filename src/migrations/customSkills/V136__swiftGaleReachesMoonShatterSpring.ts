// v135 → v136 — Swift Gale's airborne Heavy Attack bonus reaches Silkbind
// Jade's Moon Shatter Spring. A Skill Editor copy seeded before this does not
// list the buff in its reach. The buff is appended to every such copy and
// nothing else is touched, so edited values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const SWIFT_GALE_BUFF_ID = "swiftGaleAirborneHeavyBoost"
const SKILL_IDS: readonly string[] = [
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !SKILL_IDS.includes(skill.id))
    return skill
  const receives: unknown[] = Array.isArray(skill.receives) ? skill.receives : []
  if (receives.includes(SWIFT_GALE_BUFF_ID)) return skill
  return { ...skill, receives: [...receives, SWIFT_GALE_BUFF_ID] }
}

export const V136__swiftGaleReachesMoonShatterSpring: CustomSkillMigration = {
  to: 136,
  name: "V136__swiftGaleReachesMoonShatterSpring",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 136, skills }
  },
}
