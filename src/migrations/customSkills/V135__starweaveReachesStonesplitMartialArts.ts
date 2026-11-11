// v134 → v135 — Starweave's per-stack damage reaches Stonesplit Strength's
// Martial Art Skills (the Phalanxbane Blade and Snowparting Blade ones). A Skill
// Editor copy seeded before this does not list the buff in its reach. The buff
// is appended to every such copy and nothing else is touched, so edited values
// survive.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const STARWEAVE_BUFF_ID = "starweaveMartialBoost"
const SKILL_IDS: readonly string[] = [
  "stonesplitStrength-phalanxq",
  "stonesplitStrength-phalanxq-supreme",
  "stonesplitStrength-snowpartingq-slash",
  "stonesplitStrength-snowpartingq-stab",
  "stonesplitStrength-snowpartingslide",
  "stonesplitStrength-snowpartingslide-prepull",
  "stonesplitStrength-snowpartingslide-prepull-hit",
  "stonesplitStrength-snowpartingslide-reslide-prepull",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !SKILL_IDS.includes(skill.id))
    return skill
  const receives: unknown[] = Array.isArray(skill.receives) ? skill.receives : []
  if (receives.includes(STARWEAVE_BUFF_ID)) return skill
  return { ...skill, receives: [...receives, STARWEAVE_BUFF_ID] }
}

export const V135__starweaveReachesStonesplitMartialArts: CustomSkillMigration = {
  to: 135,
  name: "V135__starweaveReachesStonesplitMartialArts",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 135, skills }
  },
}
