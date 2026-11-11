// v136 → v137 — Cleftpeak's 5-stack bonus reaches Silkbind Jade's Moon Shatter
// Spring, Colorful Phoenix (the heavy-light umbrella cast) and Bamboo Breeze. A
// Skill Editor copy seeded before this does not list the buff in its reach. The
// buff is appended to every such copy and nothing else is touched, so edited
// values survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const CLEFTPEAK_BUFF_ID = "cleftpeakDeflect"
const SKILL_IDS: readonly string[] = [
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
  "silkbindJade-umb-heavylight",
  "silkbindJade-bamboo-breeze",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !SKILL_IDS.includes(skill.id))
    return skill
  const receives: unknown[] = Array.isArray(skill.receives) ? skill.receives : []
  if (receives.includes(CLEFTPEAK_BUFF_ID)) return skill
  return { ...skill, receives: [...receives, CLEFTPEAK_BUFF_ID] }
}

export const V137__cleftpeakReachesJadeTaggedHits: CustomSkillMigration = {
  to: 137,
  name: "V137__cleftpeakReachesJadeTaggedHits",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 137, skills }
  },
}
