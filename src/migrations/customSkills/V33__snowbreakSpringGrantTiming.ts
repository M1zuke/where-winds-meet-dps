// v32 → v33 — the tier-3+ Snowbreak Spring Available grant moves off cast
// start on Grave Frost and its Forgetfulness form, to the hit nearest the
// in-game grant frame; SnowpartingVC and its prepull now carry the
// availability gate as a cast condition. A Skill Editor copy seeded before
// this still grants at cast start and carries no gate.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNOWPARTING_CHARGED_ID = "stonesplitStrength-snowpartingcharged"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"
const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"

const AVAILABLE_TIER_3_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
  requiresMinTier: 3,
}

const AVAILABLE_CAST_CONDITION = { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 }

const triggerTargets = (triggers: unknown[]): unknown[] =>
  triggers.map((trigger) => (isRecord(trigger) ? trigger.targetId : undefined))

function healSnowpartingChargedHits(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 4) return hits
  const [hit0, hit1, hit2, hit3] = hits as Record<string, unknown>[]
  if (!isRecord(hit0) || !Array.isArray(hit0.triggers)) return hits
  if (!triggerTargets(hit0.triggers).includes("snowbreakSpringAvailable")) return hits
  if (!isRecord(hit3) || !Array.isArray(hit3.triggers) || hit3.triggers.length !== 0) return hits
  return [{ ...hit0, triggers: [] }, hit1, hit2, { ...hit3, triggers: [AVAILABLE_TIER_3_TRIGGER] }]
}

function healFreeGraveFrostHits(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 4) return hits
  const [hit0, hit1, hit2, hit3] = hits as Record<string, unknown>[]
  if (!isRecord(hit0) || !Array.isArray(hit0.triggers)) return hits
  const targets = triggerTargets(hit0.triggers)
  if (!targets.includes("forgetfulnessCooldown") || !targets.includes("snowbreakSpringAvailable"))
    return hits
  if (!isRecord(hit3) || !Array.isArray(hit3.triggers) || hit3.triggers.length !== 0) return hits
  const forgetfulnessCooldownTrigger = hit0.triggers.find(
    (trigger) => isRecord(trigger) && trigger.targetId === "forgetfulnessCooldown",
  )
  return [
    { ...hit0, triggers: [forgetfulnessCooldownTrigger] },
    hit1,
    hit2,
    { ...hit3, triggers: [AVAILABLE_TIER_3_TRIGGER] },
  ]
}

function addAvailabilityCastCondition(skill: Record<string, unknown>): unknown {
  if (skill.castConditions !== undefined) return skill
  return { ...skill, castConditions: [AVAILABLE_CAST_CONDITION] }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === SNOWPARTING_CHARGED_ID) {
    const healedHits = healSnowpartingChargedHits(skill.hits)
    if (healedHits === skill.hits) return skill
    return { ...skill, hits: healedHits }
  }
  if (skill.id === FREE_GRAVE_FROST_ID) {
    const healedHits = healFreeGraveFrostHits(skill.hits)
    if (healedHits === skill.hits) return skill
    return { ...skill, hits: healedHits }
  }
  if (skill.id === SNOWPARTING_VC_ID || skill.id === SNOWPARTING_VC_PREPULL_ID)
    return addAvailabilityCastCondition(skill)
  return skill
}

export const V33__snowbreakSpringGrantTiming: CustomSkillMigration = {
  to: 33,
  name: "V33__snowbreakSpringGrantTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 33, skills }
  },
}
