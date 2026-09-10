// v5 → v6 — Bellstrike Umbra's bleed tick no longer demotes its own matching
// coefficient, and Blood Burst is authored as an ordinary weapon hit rather
// than sustain-tagged. A Skill Editor copy seeded before that still carries
// the old field. Only a copy still identical to what was seeded is rewritten:
// once a value differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const BLEED_TICK_ID = "bellstrikeUmbra-bleed-tick"
const BLEED_DETONATION_ID = "bellstrikeUmbra-bleed-detonation"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healBleedRowDefaults(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === BLEED_TICK_ID && skill.elevatedAttributeMultiplier === false) {
    const { elevatedAttributeMultiplier: _elevatedAttributeMultiplier, ...rest } = skill
    return rest
  }
  if (skill.id === BLEED_DETONATION_ID && skill.skillType === "sustain") {
    return { ...skill, skillType: "weapon" }
  }
  return skill
}

export const V6__bleedRowDefaults: CustomSkillMigration = {
  to: 6,
  name: "V6__bleedRowDefaults",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healBleedRowDefaults) : blob.skills
    return { ...blob, v: 6, skills }
  },
}
