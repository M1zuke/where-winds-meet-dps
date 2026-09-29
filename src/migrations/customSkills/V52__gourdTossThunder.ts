// v51 → v52 — Peak's Springless Silence now reads and grants Gourd Toss's own
// Thunder bonus. A Skill Editor copy seeded before this still lacks both.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const TARGET_SKILL_ID = "silkbindJade-fanspecial"
const GRANT_TARGET_ID = "gourdTossThunder"

function alreadyGrantsThunder(triggers: unknown): boolean {
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

  const existingReceives = Array.isArray(skill.receives) ? skill.receives : []
  const receives = existingReceives.includes(GRANT_TARGET_ID)
    ? existingReceives
    : [GRANT_TARGET_ID, ...existingReceives]

  const targetHitIndex = skill.hits.length - 1
  const hits = skill.hits.map((hitValue, index) => {
    if (index !== targetHitIndex || !isRecord(hitValue)) return hitValue
    const existingTriggers = Array.isArray(hitValue.triggers) ? hitValue.triggers : []
    if (alreadyGrantsThunder(existingTriggers)) return hitValue
    return {
      ...hitValue,
      triggers: [
        ...existingTriggers,
        {
          kind: "applyBuff",
          targetId: GRANT_TARGET_ID,
          stacks: 1,
          condition: null,
          appliesOnCastEnd: true,
          requiresParam: "gourdToss",
          requiresMinTier: 3,
        },
      ],
    }
  })

  return { ...skill, receives, hits }
}

export const V52__gourdTossThunder: CustomSkillMigration = {
  to: 52,
  name: "V52__gourdTossThunder",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 52, skills }
  },
}
