// v54 → v55 — Ghostly Steps now also grants the Mirage Endurance cost
// reduction (a class-scoped dodge cut and an unscoped every-spend cut,
// multiplying). A Skill Editor copy seeded before this still lacks the grant.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const GRANT_TARGET_ID = "mirageEnduranceCostReduction"

const TARGET_SKILL_IDS = new Set([
  "universal-ghostly-steps",
  "bellstrikeUmbra-ghostly-steps",
  "bellstrikeSplendor-ghostly-steps",
  "stonesplitStrength-ghostly-steps",
  "bamboocutDraught-ghostly-steps",
  "silkbindJade-ghostly-steps",
])

function alreadyGrantsCostReduction(triggers: unknown): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) && trigger.kind === "applyBuff" && trigger.targetId === GRANT_TARGET_ID,
    )
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !TARGET_SKILL_IDS.has(skill.id))
    return skill
  if (!Array.isArray(skill.hits)) return skill

  const hits = skill.hits.map((hitValue, index) => {
    if (index !== 0 || !isRecord(hitValue)) return hitValue
    const existingTriggers = Array.isArray(hitValue.triggers) ? hitValue.triggers : []
    if (alreadyGrantsCostReduction(existingTriggers)) return hitValue
    return {
      ...hitValue,
      triggers: [
        ...existingTriggers,
        { kind: "applyBuff", targetId: GRANT_TARGET_ID, stacks: 1, condition: null },
      ],
    }
  })

  return { ...skill, hits }
}

export const V55__ghostlyStepsEnduranceCostReduction: CustomSkillMigration = {
  to: 55,
  name: "V55__ghostlyStepsEnduranceCostReduction",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 55, skills }
  },
}
