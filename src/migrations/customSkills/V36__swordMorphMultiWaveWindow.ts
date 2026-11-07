// v35 → v36 — Vagrant Sword's level-2 release fires three waves only while
// Sword Morph's multi-wave window holds; the forms that already assumed it
// (SwordHeavyCharged, its 2-Hit cancel, Energy Surge, the pre-pull form and
// Shadow Step) now grant or read that window instead of assuming it. A Skill
// Editor copy seeded before this still fires three waves unconditionally.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SWORD_HEAVY_CHARGED_ID = "bellstrikeSplendor-swordheavycharged"
const SWORD_HEAVY_CHARGED_2_HIT_ID = "bellstrikeSplendor-swordheavycharged-2-hit"
const SWORD_HEAVY_CHARGED_PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"
const SWORD_SPECIAL_ID = "bellstrikeSplendor-swordspecial"

const WINDOW_ID = "swordMorphMultiWaveWindow"
const WINDOW_ACTIVE_CONDITION = { buffId: WINDOW_ID, op: "gte", stacks: 1 }

const BOOTSTRAP_TRIGGER = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: null,
  requiresParam: "swordMorph",
}

const RELEASE_GRANT_TRIGGER = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: null,
  requiresParam: "swordMorph",
  requiresMinTier: 4,
}

const SUSTAIN_TRIGGER = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: WINDOW_ACTIVE_CONDITION,
  requiresParam: "swordMorph",
  requiresMinTier: 4,
}

const OLD_HIT_0 = {
  physMultiplier: 1.3066,
  attributeMultiplier: 1.9598,
  physFixed: 361.6,
  attributeFixed: 197.2,
}

const carriesWindowTrigger = (triggers: unknown[]): boolean =>
  triggers.some((trigger) => isRecord(trigger) && trigger.targetId === WINDOW_ID)

function healSwordHeavyCharged(skill: Record<string, unknown>): unknown {
  if (!Array.isArray(skill.hits) || skill.hits.length !== 3) return skill
  const [hit0, hit1, hit2] = skill.hits as Record<string, unknown>[]
  if (
    !isRecord(hit0) ||
    hit0.variants !== undefined ||
    hit0.physMultiplier !== OLD_HIT_0.physMultiplier ||
    hit0.attributeMultiplier !== OLD_HIT_0.attributeMultiplier ||
    hit0.physFixed !== OLD_HIT_0.physFixed ||
    hit0.attributeFixed !== OLD_HIT_0.attributeFixed ||
    !isRecord(hit1) ||
    hit1.conditions !== undefined ||
    !isRecord(hit2) ||
    hit2.conditions !== undefined ||
    !Array.isArray(hit0.triggers) ||
    hit0.triggers.length !== 1 ||
    carriesWindowTrigger(hit0.triggers)
  )
    return skill
  return {
    ...skill,
    castFrames: 126,
    hits: [
      {
        ...hit0,
        physMultiplier: 3.2664,
        attributeMultiplier: 4.8996,
        physFixed: 904,
        attributeFixed: 493,
        triggers: [...hit0.triggers, SUSTAIN_TRIGGER],
        variants: [
          {
            id: "hv-swordheavycharged-hit-0-multi-wave-window",
            label: "Multi-Wave Window",
            conditions: [WINDOW_ACTIVE_CONDITION],
            ...OLD_HIT_0,
            castFrames: 140,
          },
        ],
      },
      { ...hit1, conditions: [WINDOW_ACTIVE_CONDITION] },
      { ...hit2, conditions: [WINDOW_ACTIVE_CONDITION] },
    ],
  }
}

function healSwordHeavyCharged2Hit(skill: Record<string, unknown>): unknown {
  const withCondition =
    skill.castConditions === undefined
      ? { ...skill, castConditions: [WINDOW_ACTIVE_CONDITION] }
      : skill
  if (!Array.isArray((withCondition as Record<string, unknown>).hits)) return withCondition
  const hits = (withCondition as Record<string, unknown>).hits as Record<string, unknown>[]
  const [hit0, ...restHits] = hits
  if (
    !isRecord(hit0) ||
    !Array.isArray(hit0.triggers) ||
    hit0.triggers.length !== 1 ||
    !hit0.triggers.some(
      (trigger) => isRecord(trigger) && trigger.targetId === "energySurgeGrant",
    ) ||
    carriesWindowTrigger(hit0.triggers)
  )
    return withCondition
  return {
    ...withCondition,
    hits: [{ ...hit0, triggers: [...hit0.triggers, SUSTAIN_TRIGGER] }, ...restHits],
  }
}

function addTriggerToFirstHit(
  skill: Record<string, unknown>,
  trigger: typeof BOOTSTRAP_TRIGGER | typeof RELEASE_GRANT_TRIGGER,
): unknown {
  if (!Array.isArray(skill.hits) || skill.hits.length === 0) return skill
  const [hit0, ...restHits] = skill.hits as Record<string, unknown>[]
  if (!isRecord(hit0) || !Array.isArray(hit0.triggers) || carriesWindowTrigger(hit0.triggers))
    return skill
  return { ...skill, hits: [{ ...hit0, triggers: [...hit0.triggers, trigger] }, ...restHits] }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === SWORD_HEAVY_CHARGED_ID) return healSwordHeavyCharged(skill)
  if (skill.id === SWORD_HEAVY_CHARGED_2_HIT_ID) return healSwordHeavyCharged2Hit(skill)
  if (skill.id === ENERGY_SURGE_ID) return addTriggerToFirstHit(skill, RELEASE_GRANT_TRIGGER)
  if (skill.id === SWORD_HEAVY_CHARGED_PREPULL_ID)
    return addTriggerToFirstHit(skill, RELEASE_GRANT_TRIGGER)
  if (skill.id === SWORD_SPECIAL_ID) return addTriggerToFirstHit(skill, BOOTSTRAP_TRIGGER)
  return skill
}

export const V36__swordMorphMultiWaveWindow: CustomSkillMigration = {
  to: 36,
  name: "V36__swordMorphMultiWaveWindow",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 36, skills }
  },
}
