// v7 → v8 — River Flow is now one status opening at the granting cast's end,
// rather than a hit-frame gate paired with a cast-end buff module. A Skill
// Editor copy seeded before that carries the trigger without the flag and an
// entry in `triggersBuffs` that no longer names anything. Triggers have no
// editable field in the UI, so a saved trigger is always the seeded one and can
// be healed unconditionally.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const RIVER_FLOW_ID = "potentRiverFlow"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function healTrigger(trigger: unknown): unknown {
  if (!isRecord(trigger)) return trigger
  if (trigger.kind !== "applyBuff" || trigger.targetId !== RIVER_FLOW_ID) return trigger
  if (trigger.appliesOnCastEnd === true) return trigger
  return { ...trigger, appliesOnCastEnd: true }
}

function healHit(hit: unknown): unknown {
  if (!isRecord(hit) || !Array.isArray(hit.triggers)) return hit
  return { ...hit, triggers: hit.triggers.map(healTrigger) }
}

export function healRiverFlowApplication(skill: unknown): unknown {
  if (!isRecord(skill)) return skill
  const next = { ...skill }
  if (Array.isArray(skill.hits)) next.hits = skill.hits.map(healHit)
  if (Array.isArray(skill.triggersBuffs))
    next.triggersBuffs = skill.triggersBuffs.filter((id) => id !== RIVER_FLOW_ID)
  return next
}

export const V8__riverFlowAppliesOnCastEnd: CustomSkillMigration = {
  to: 8,
  name: "V8__riverFlowAppliesOnCastEnd",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healRiverFlowApplication)
      : blob.skills
    return { ...blob, v: 8, skills }
  },
}
