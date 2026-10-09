// v56 → v57 — the Bamboocut Draught follow-up cancel form is cancelled by
// the next rotation step, not by a Deflect Cancel. A Skill Editor copy
// seeded before this field existed still defaults to the generic rule.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const TARGET_ID = "bamboocutDraught-nightwick-primepick-follow-up-cancel"

export function healSkill(skill: unknown): unknown {
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) return skill
  const record = skill as Record<string, unknown>
  if (record.id !== TARGET_ID || record.cancelledBy !== undefined) return skill
  return { ...record, cancelledBy: "nextSkill" }
}

export const V57__nightwickFollowUpCancelledByNextSkill: CustomSkillMigration = {
  to: 57,
  name: "V57__nightwickFollowUpCancelledByNextSkill",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 57, skills }
  },
}
