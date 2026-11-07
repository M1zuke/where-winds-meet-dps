// v31 → v32 — Deflect, Grave Frost and the Dual-Weapon Skill now grant the
// `snowbreakSpringAvailable` marker Snowbreak Spring's real-game availability
// gate reads, and SnowpartingVC now attaches its own `snowbreakSpringCooldown`
// spacing marker on cast. A Skill Editor copy seeded before this grants
// neither.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"
const SNOWPARTING_CHARGED_ID = "stonesplitStrength-snowpartingcharged"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"
const SNOWPARTING_DUAL_ID = "stonesplitStrength-snowpartingdual"
const SNOWPARTING_DUAL_PREPULL_ID = "stonesplitStrength-snowpartingdual-prepull"
const DEFLECT_ID = "stonesplitStrength-deflect"

const AVAILABLE_TIER_3_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
  requiresMinTier: 3,
}
const AVAILABLE_UNGATED_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
}
const COOLDOWN_GRANT_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringCooldown",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
}

const OLD_SNOWPARTING_VC_TRIGGERS_LENGTH = 4
const OLD_SNOWPARTING_VC_PREPULL_TRIGGERS_LENGTH = 3

function healSnowpartingVcHits(hits: unknown, oldLength: number): unknown {
  if (!Array.isArray(hits) || hits.length !== 1) return hits
  const [hit] = hits
  if (!isRecord(hit) || !Array.isArray(hit.triggers) || hit.triggers.length !== oldLength)
    return hits
  return [{ ...hit, triggers: [COOLDOWN_GRANT_TRIGGER, ...hit.triggers] }]
}

function healFirstHitTriggers(
  hits: unknown,
  oldTriggersLength: number,
  addedTrigger: unknown,
): unknown {
  if (!Array.isArray(hits) || hits.length === 0) return hits
  const [firstHit, ...restHits] = hits as Record<string, unknown>[]
  if (
    !isRecord(firstHit) ||
    !Array.isArray(firstHit.triggers) ||
    firstHit.triggers.length !== oldTriggersLength
  )
    return hits
  return [{ ...firstHit, triggers: [...firstHit.triggers, addedTrigger] }, ...restHits]
}

function addAvailableTrigger(
  skill: Record<string, unknown>,
  oldTriggersLength: number,
  tierGated: boolean,
): unknown {
  return {
    ...skill,
    hits: healFirstHitTriggers(
      skill.hits,
      oldTriggersLength,
      tierGated ? AVAILABLE_TIER_3_TRIGGER : AVAILABLE_UNGATED_TRIGGER,
    ),
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === SNOWPARTING_VC_ID || skill.id === SNOWPARTING_VC_PREPULL_ID) {
    const oldLength =
      skill.id === SNOWPARTING_VC_ID
        ? OLD_SNOWPARTING_VC_TRIGGERS_LENGTH
        : OLD_SNOWPARTING_VC_PREPULL_TRIGGERS_LENGTH
    const healedHits = healSnowpartingVcHits(skill.hits, oldLength)
    if (healedHits === skill.hits) return skill
    return { ...skill, hits: healedHits }
  }
  if (skill.id === SNOWPARTING_CHARGED_ID) return addAvailableTrigger(skill, 0, true)
  if (skill.id === FREE_GRAVE_FROST_ID) return addAvailableTrigger(skill, 1, true)
  if (skill.id === SNOWPARTING_DUAL_ID || skill.id === SNOWPARTING_DUAL_PREPULL_ID)
    return addAvailableTrigger(skill, 0, true)
  if (skill.id === DEFLECT_ID) return addAvailableTrigger(skill, 0, false)
  return skill
}

export const V32__snowbreakSpringAvailability: CustomSkillMigration = {
  to: 32,
  name: "V32__snowbreakSpringAvailability",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 32, skills }
  },
}
