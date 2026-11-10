// v114 → v115 — a successful Deflect also lays Throat-Pierced's five stacks
// through its own grant buff. A Skill Editor copy seeded before that still
// lists only Cleftpeak's grant on the Deflect skills. Only a list still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const DEFLECT_SKILL_IDS: ReadonlySet<string> = new Set([
  "stonesplitStrength-deflect",
  "stonesplitStrength-deflect-cancel",
  "bellstrikeUmbra-deflect-cancel",
  "bellstrikeSplendor-deflect-cancel",
  "bamboocutDraught-deflect-cancel-prepull",
  "bellstrikeUmbra-deflect-cancel-prepull",
  "bellstrikeSplendor-deflect-cancel-prepull",
  "silkbindJade-deflect-cancel-prepull",
  "stonesplitStrength-deflect-cancel-prepull",
])

const SEEDED_TRIGGERS_BUFFS = ["cleftpeakDeflectGrant"]
const HEALED_TRIGGERS_BUFFS = ["cleftpeakDeflectGrant", "throatPierceDeflectGrant"]

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !DEFLECT_SKILL_IDS.has(skill.id))
    return skill
  if (JSON.stringify(skill.triggersBuffs) !== JSON.stringify(SEEDED_TRIGGERS_BUFFS)) return skill
  return { ...skill, triggersBuffs: [...HEALED_TRIGGERS_BUFFS] }
}

export const V115__throatPierceDeflectGrant: CustomSkillMigration = {
  to: 115,
  name: "V115__throatPierceDeflectGrant",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 115, skills }
  },
}
