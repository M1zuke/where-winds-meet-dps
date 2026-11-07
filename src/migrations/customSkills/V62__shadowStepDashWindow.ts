// v61 → v62 — Shadow Step's first hit now opens the 2.5 s window the new
// Sword - Dash follow-up needs to be castable at all. A Skill Editor copy
// seeded before this still lacks the grant. The grant is only added, never
// replaced.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const GRANT_TARGET_ID = "shadowStepDashWindow"

const WINDOW_DURATION_BY_SKILL_ID: Record<string, number> = {
  "bellstrikeSplendor-swordspecial": 144,
  "bellstrikeSplendor-swordspecial-2nd": 167,
  "bellstrikeSplendor-swordspecial-deflect": 167,
}

function alreadyGrantsWindow(triggers: unknown[]): boolean {
  return triggers.some(
    (trigger) =>
      isRecord(trigger) && trigger.kind === "applyBuff" && trigger.targetId === GRANT_TARGET_ID,
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const durationFrames = WINDOW_DURATION_BY_SKILL_ID[skill.id]
  if (durationFrames === undefined) return skill
  const hits = skill.hits.map((hitValue, index) => {
    if (index !== 0 || !isRecord(hitValue)) return hitValue
    const existingTriggers = Array.isArray(hitValue.triggers) ? hitValue.triggers : []
    if (alreadyGrantsWindow(existingTriggers)) return hitValue
    return {
      ...hitValue,
      triggers: [
        ...existingTriggers,
        {
          kind: "applyBuff",
          targetId: GRANT_TARGET_ID,
          stacks: 1,
          condition: null,
          durationFrames,
        },
      ],
    }
  })
  return { ...skill, hits }
}

export const V62__shadowStepDashWindow: CustomSkillMigration = {
  to: 62,
  name: "V62__shadowStepDashWindow",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 62, skills }
  },
}
