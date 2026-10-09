// v30 → v31 — Forgetfulness moved off the class-buff system onto a ledger
// gate whose grant is conditioned on a new `forgetfulnessCooldown` marker
// (started by the free Grave Frost, cleared on an Exhausted-boss hit)
// instead of the module's own flat 6 s cooldown from the grant. A Skill
// Editor copy seeded before that still declares `triggersBuffs: [...,
// "forgetfulness"]` and carries none of the new hit triggers.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"

const OLD_TRIGGERS_BUFFS = ["throatPierced", "forgetfulness"]
const NEW_TRIGGERS_BUFFS = ["throatPierced"]

const FORGETFULNESS_GATE_TRIGGER = {
  kind: "applyBuff",
  targetId: "forgetfulness",
  stacks: 1,
  condition: { buffId: "forgetfulnessCooldown", op: "eq", stacks: 0 },
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}
const FORGETFULNESS_COOLDOWN_RESET_TRIGGER = {
  kind: "clearStatus",
  targetId: "forgetfulnessCooldown",
  stacks: 1,
  condition: null,
  phase: "exhausted",
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}
const FORGETFULNESS_COOLDOWN_GRANT_TRIGGER = {
  kind: "applyBuff",
  targetId: "forgetfulnessCooldown",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}

const ANXISOLDIERHENG_CAST_SKILL_TRIGGER = {
  kind: "castSkill",
  targetId: "stonesplitStrength-anxisoldierheng",
  stacks: 0,
  condition: { buffId: "ironGuards", op: "gte", stacks: 1, source: "buffEngine" },
  requiresParam: "frostCladNight",
  requiresMinTier: 1,
}
const DREAD_EXTEND_TRIGGER = {
  kind: "applyBuff",
  targetId: "buff-stonesplitStrength-dread",
  stacks: 0,
  condition: null,
  extendFrames: 120,
  extendOnly: true,
  phase: "exhausted",
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}

const OLD_SNOWPARTING_VC_TRIGGERS = [ANXISOLDIERHENG_CAST_SKILL_TRIGGER, DREAD_EXTEND_TRIGGER]
const OLD_SNOWPARTING_VC_PREPULL_TRIGGERS = [ANXISOLDIERHENG_CAST_SKILL_TRIGGER]

function healSnowpartingHits(hits: unknown, oldTriggers: readonly unknown[]): unknown {
  if (!Array.isArray(hits) || hits.length !== 1) return hits
  const [hit] = hits
  if (!isRecord(hit) || !Array.isArray(hit.triggers)) return hits
  if (JSON.stringify(hit.triggers) !== JSON.stringify(oldTriggers)) return hits
  return [
    {
      ...hit,
      triggers: [...hit.triggers, FORGETFULNESS_GATE_TRIGGER, FORGETFULNESS_COOLDOWN_RESET_TRIGGER],
    },
  ]
}

function healFreeGraveFrostHits(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length === 0) return hits
  const [firstHit, ...restHits] = hits as Record<string, unknown>[]
  if (!isRecord(firstHit) || !Array.isArray(firstHit.triggers) || firstHit.triggers.length !== 0)
    return hits
  return [{ ...firstHit, triggers: [FORGETFULNESS_COOLDOWN_GRANT_TRIGGER] }, ...restHits]
}

function healTriggersBuffs(triggersBuffs: unknown): unknown {
  if (!Array.isArray(triggersBuffs)) return triggersBuffs
  if (JSON.stringify(triggersBuffs) !== JSON.stringify(OLD_TRIGGERS_BUFFS)) return triggersBuffs
  return NEW_TRIGGERS_BUFFS
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === SNOWPARTING_VC_ID) {
    return {
      ...skill,
      triggersBuffs: healTriggersBuffs(skill.triggersBuffs),
      hits: healSnowpartingHits(skill.hits, OLD_SNOWPARTING_VC_TRIGGERS),
    }
  }
  if (skill.id === SNOWPARTING_VC_PREPULL_ID) {
    return {
      ...skill,
      triggersBuffs: healTriggersBuffs(skill.triggersBuffs),
      hits: healSnowpartingHits(skill.hits, OLD_SNOWPARTING_VC_PREPULL_TRIGGERS),
    }
  }
  if (skill.id === FREE_GRAVE_FROST_ID) {
    return { ...skill, hits: healFreeGraveFrostHits(skill.hits) }
  }
  return skill
}

export const V31__forgetfulnessCooldownMarker: CustomSkillMigration = {
  to: 31,
  name: "V31__forgetfulnessCooldownMarker",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 31, skills }
  },
}
