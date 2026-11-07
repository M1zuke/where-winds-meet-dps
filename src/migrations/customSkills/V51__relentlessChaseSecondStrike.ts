// v50 → v51 — Relentless Chase's first strike now opens the 6 s window its
// second strike (a new built-in skill) needs to be offered at all. A Skill
// Editor copy seeded before this still lacks the grant.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const TARGET_SKILL_ID = "bellstrikeSplendor-swordq-2nd"
const GRANT_TARGET_ID = "relentlessChaseWindow"

function alreadyGrantsWindow(triggers: unknown): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) && trigger.kind === "applyBuff" && trigger.targetId === GRANT_TARGET_ID,
    )
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== TARGET_SKILL_ID || !Array.isArray(skill.hits)) return skill
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
          durationFrames: 360,
        },
      ],
    }
  })
  return { ...skill, hits }
}

export const V51__relentlessChaseSecondStrike: CustomSkillMigration = {
  to: 51,
  name: "V51__relentlessChaseSecondStrike",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 51, skills }
  },
}
