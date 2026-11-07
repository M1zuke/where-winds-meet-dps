// v23 → v24 — Bellstrike Umbra: Sober Sorrow's River Flow ladder (Water
// Drop / Spring Surge / River Flow / Empowered River Flow, chosen by combo
// instead of a single always-on gate), Sweep All's payload (no cooldown gate
// on Bleeding, its own Shattered Stone hit, the Spring Surge coefficient
// variant), Blood Burst's forced-Affinity extension reaching Bleeding too,
// the Special attunement reaching Crisscross - Inner Balance III, and
// Drifting Thrust's real charge-stage-2 shape. A Skill Editor copy seeded
// before any of these still carries the old shape.
//
// Trigger and tag arrays have no editable field in the Skill Editor, so a
// saved one is always the seeded one and is healed unconditionally. Hit
// coefficients ARE editable: only a hit whose row still matches what was
// seeded is replaced wholesale — once a value differs, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
}

function coefficientsMatch(hit: unknown, row: CoefficientRow): boolean {
  return (
    isRecord(hit) &&
    hit.physMultiplier === row.physMultiplier &&
    hit.attributeMultiplier === row.attributeMultiplier &&
    hit.physFixed === row.physFixed
  )
}

const BLEED_TICK_DEBUFF_ID = "debuff-bellstrikeUmbra-bleed-tick"
const SPEAR_SPECIAL_COOLDOWN_ID = "buff-bellstrikeUmbra-spear-special-cooldown"
const BLEED_DETONATION_SKILL_ID = "bellstrikeUmbra-bleed-detonation"
const DEFENSE_DOWN_ID = "debuff-bellstrikeUmbra-defense-down"
const RIVER_FLOW_ID = "potentRiverFlow"
const WATER_DROP_ID = "buff-bellstrikeUmbra-water-drop"
const SPRING_SURGE_ID = "buff-bellstrikeUmbra-spring-surge"
const EMPOWERED_ID = "buff-bellstrikeUmbra-empowered-river-flow"
const WOLFCHASERS_ART_SLOTTED_ID = "buff-bellstrikeUmbra-wolfchasers-art-slotted"
const ZENITH_DETONATION_ID = "buff-bellstrikeUmbra-zenith-detonation"
const SMOLDER_ID = "debuff-mystic-smolder"
const RIVER_FLOW_MIN_BLEEDING_STACKS = 1
const RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES = 180

function riverFlowTierTriggers(empoweredStacks: number): unknown[] {
  const wolfchasersArtSlottedCondition = {
    buffId: WOLFCHASERS_ART_SLOTTED_ID,
    op: "gte",
    stacks: 1,
  }
  return [
    {
      kind: "applyBuff",
      targetId: WOLFCHASERS_ART_SLOTTED_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: WATER_DROP_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: WATER_DROP_ID,
      stacks: 1,
      condition: wolfchasersArtSlottedCondition,
      appliesOnCastEnd: true,
      extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
      extendOnly: true,
    },
    {
      kind: "applyBuff",
      targetId: SPRING_SURGE_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: SPRING_SURGE_ID,
      stacks: 1,
      condition: wolfchasersArtSlottedCondition,
      appliesOnCastEnd: true,
      extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
      extendOnly: true,
    },
    {
      kind: "applyBuff",
      targetId: RIVER_FLOW_ID,
      stacks: 1,
      condition: {
        buffId: BLEED_TICK_DEBUFF_ID,
        op: "gte",
        stacks: RIVER_FLOW_MIN_BLEEDING_STACKS,
      },
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: EMPOWERED_ID,
      stacks: 1,
      condition: { buffId: BLEED_TICK_DEBUFF_ID, op: "gte", stacks: empoweredStacks },
      appliesOnCastEnd: true,
    },
  ]
}

function matchesOldRiverFlowTrigger(trigger: unknown): boolean {
  return (
    isRecord(trigger) &&
    trigger.kind === "applyBuff" &&
    trigger.targetId === RIVER_FLOW_ID &&
    trigger.condition === null &&
    trigger.appliesOnCastEnd === true
  )
}

function healRiverFlowTierHit(hit: unknown, empoweredStacks: number): unknown {
  if (!isRecord(hit) || !Array.isArray(hit.triggers) || hit.triggers.length !== 1) return hit
  if (!matchesOldRiverFlowTrigger(hit.triggers[0])) return hit
  return { ...hit, triggers: riverFlowTierTriggers(empoweredStacks) }
}

export function healSpearqRiverFlowTiers(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 6) return hits
  return hits.map((hit, index) => (index === 4 ? healRiverFlowTierHit(hit, 1) : hit))
}

export function healSpearq5HitCancelRiverFlowTiers(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 5) return hits
  return hits.map((hit, index) => (index === 4 ? healRiverFlowTierHit(hit, 4) : hit))
}

function sweepAllPayloadTriggers(): unknown[] {
  const riverFlowCondition = { buffId: RIVER_FLOW_ID, op: "gte", stacks: 1 }
  const empoweredCondition = { buffId: EMPOWERED_ID, op: "gte", stacks: 1 }
  const cooldownCondition = { buffId: SPEAR_SPECIAL_COOLDOWN_ID, op: "eq", stacks: 0 }
  return [
    { kind: "applyDot", targetId: BLEED_TICK_DEBUFF_ID, stacks: 1, condition: riverFlowCondition },
    {
      kind: "applyDot",
      targetId: BLEED_TICK_DEBUFF_ID,
      stacks: 1,
      condition: empoweredCondition,
      conditions: [cooldownCondition],
    },
    {
      kind: "applyDot",
      targetId: BLEED_TICK_DEBUFF_ID,
      stacks: 1,
      condition: empoweredCondition,
      conditions: [cooldownCondition],
    },
    {
      kind: "castSkill",
      targetId: BLEED_DETONATION_SKILL_ID,
      stacks: 0,
      condition: empoweredCondition,
      conditions: [cooldownCondition],
    },
    {
      kind: "applyBuff",
      targetId: SPEAR_SPECIAL_COOLDOWN_ID,
      stacks: 1,
      condition: empoweredCondition,
      conditions: [cooldownCondition],
    },
  ]
}

const SWEEP_ALL_OLD_HIT_1: CoefficientRow = {
  physMultiplier: 0.6848704,
  attributeMultiplier: 1.0273056,
  physFixed: 189.76,
}
const SWEEP_ALL_OLD_HIT_2: CoefficientRow = {
  physMultiplier: 1.0273056,
  attributeMultiplier: 1.5409584,
  physFixed: 284.64,
}

function sweepAllShatteredStoneHit(): unknown {
  return {
    id: "hit-0",
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyDebuff",
        targetId: DEFENSE_DOWN_ID,
        stacks: 1,
        condition: { buffId: SPRING_SURGE_ID, op: "gte", stacks: 1 },
      },
    ],
  }
}

function sweepAllFirstHit(): unknown {
  return {
    id: "hit-1",
    frame: 16,
    physMultiplier: SWEEP_ALL_OLD_HIT_1.physMultiplier,
    attributeMultiplier: SWEEP_ALL_OLD_HIT_1.attributeMultiplier,
    physFixed: SWEEP_ALL_OLD_HIT_1.physFixed,
    attributeFixed: 103.36,
    extraCritDamage: 0,
    triggers: sweepAllPayloadTriggers(),
    variants: [
      {
        id: "hv-spearspecial-hit-1-river-flow",
        label: "River Flow",
        conditions: [{ buffId: RIVER_FLOW_ID, op: "gte", stacks: 1 }],
        physMultiplier: 1.0273056,
        attributeMultiplier: 1.5409584,
        physFixed: 284.64,
        attributeFixed: 155.04,
      },
      {
        id: "hv-spearspecial-hit-1-spring-surge",
        label: "Spring Surge",
        conditions: [{ buffId: SPRING_SURGE_ID, op: "gte", stacks: 1 }],
        physMultiplier: 0.856088,
        attributeMultiplier: 1.284132,
        physFixed: 237.2,
        attributeFixed: 129.2,
      },
    ],
  }
}

function sweepAllSecondHit(): unknown {
  return {
    id: "hit-2",
    frame: 58,
    physMultiplier: SWEEP_ALL_OLD_HIT_2.physMultiplier,
    attributeMultiplier: SWEEP_ALL_OLD_HIT_2.attributeMultiplier,
    physFixed: SWEEP_ALL_OLD_HIT_2.physFixed,
    attributeFixed: 155.04,
    extraCritDamage: 0,
    triggers: sweepAllPayloadTriggers(),
    variants: [
      {
        id: "hv-spearspecial-hit-2-river-flow",
        label: "River Flow",
        conditions: [{ buffId: RIVER_FLOW_ID, op: "gte", stacks: 1 }],
        physMultiplier: 1.5409584,
        attributeMultiplier: 2.3114376,
        physFixed: 426.96,
        attributeFixed: 232.56,
      },
      {
        id: "hv-spearspecial-hit-2-spring-surge",
        label: "Spring Surge",
        conditions: [{ buffId: SPRING_SURGE_ID, op: "gte", stacks: 1 }],
        physMultiplier: 1.284132,
        attributeMultiplier: 1.926198,
        physFixed: 355.8,
        attributeFixed: 193.8,
      },
    ],
  }
}

export function healSweepAllHits(hits: unknown): unknown {
  if (!Array.isArray(hits)) return hits
  if (hits.length === 2 && coefficientsMatch(hits[0], SWEEP_ALL_OLD_HIT_1)) {
    if (!coefficientsMatch(hits[1], SWEEP_ALL_OLD_HIT_2)) return hits
    return [sweepAllShatteredStoneHit(), sweepAllFirstHit(), sweepAllSecondHit()]
  }
  if (hits.length === 1 && coefficientsMatch(hits[0], SWEEP_ALL_OLD_HIT_1)) {
    return [sweepAllShatteredStoneHit(), sweepAllFirstHit()]
  }
  return hits
}

function bleedExtendTrigger(): unknown {
  return {
    kind: "applyDebuff",
    targetId: BLEED_TICK_DEBUFF_ID,
    stacks: 0,
    condition: { buffId: ZENITH_DETONATION_ID, op: "gte", stacks: 1 },
    extendFrames: 600,
    extendOnly: true,
    maxExtendedDurationFrames: 960,
  }
}

function hasBleedExtendTrigger(triggers: readonly unknown[]): boolean {
  return triggers.some(
    (trigger) =>
      isRecord(trigger) &&
      trigger.kind === "applyDebuff" &&
      trigger.targetId === BLEED_TICK_DEBUFF_ID,
  )
}

export function healBleedDetonationHits(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 1) return hits
  const [hit] = hits
  if (!isRecord(hit) || !Array.isArray(hit.triggers)) return hits
  if (hasBleedExtendTrigger(hit.triggers)) return hits
  const hasSmolderExtend = hit.triggers.some(
    (trigger) =>
      isRecord(trigger) && trigger.kind === "applyDebuff" && trigger.targetId === SMOLDER_ID,
  )
  if (!hasSmolderExtend) return hits
  return [{ ...hit, triggers: [...hit.triggers, bleedExtendTrigger()] }]
}

const CROSSWIND_BLADE_IDS = new Set([
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
])
const SWORD_SPECIAL_ATTUNE_TAG = "attune:swordSpecial"

// A copy that already carries an `attune:` tag — including one the Skill
// Editor cleared to none — keeps whatever it has; only a copy with none at
// all gets the built-in's new attunement.
export function healCrosswindBladeTags(id: string, tags: unknown): unknown {
  if (!CROSSWIND_BLADE_IDS.has(id) || !Array.isArray(tags)) return tags
  if (tags.some((tag) => typeof tag === "string" && tag.startsWith("attune:"))) return tags
  return [...tags, SWORD_SPECIAL_ATTUNE_TAG]
}

const HEAVY_ATTACK_TAG = "attack:heavy"
const NO_LONGER_HEAVY_ATTACK_IDS = new Set([
  "bellstrikeUmbra-spearheavy-1-hit",
  "bellstrikeUmbra-spearheavy-1-hit-prepull",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
])

export function healHeavyAttackTag(id: string, tags: unknown): unknown {
  if (!NO_LONGER_HEAVY_ATTACK_IDS.has(id) || !Array.isArray(tags)) return tags
  return tags.filter((tag) => tag !== HEAVY_ATTACK_TAG)
}

const SPEARHEAVY_ID = "bellstrikeUmbra-spearheavy"
const SPEARHEAVY_OLD_ROWS: readonly CoefficientRow[] = [
  { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
  { physMultiplier: 0.750527, attributeMultiplier: 1.12579, physFixed: 207.6 },
  { physMultiplier: 0.375263, attributeMultiplier: 0.562895, physFixed: 103.8 },
  { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346 },
  { physMultiplier: 0.331483, attributeMultiplier: 0.497224, physFixed: 91.69 },
]
const SPEARHEAVY_STAGE_2_DRILL_FRAMES = [
  5, 14, 23, 32, 41, 51, 61, 71, 81, 92, 101, 112, 123, 132, 142,
]

function spearheavyStage2Hits(): unknown[] {
  const drill = SPEARHEAVY_STAGE_2_DRILL_FRAMES.map((frame, index) => ({
    id: `hit-${index}`,
    frame,
    physMultiplier: 0.3314827,
    attributeMultiplier: 0.497224,
    physFixed: 91.69,
    attributeFixed: 49.979,
    extraCritDamage: 0,
    triggers: [],
  }))
  return [
    ...drill,
    {
      id: `hit-${SPEARHEAVY_STAGE_2_DRILL_FRAMES.length}`,
      frame: 155,
      physMultiplier: 1.250878,
      attributeMultiplier: 1.876317,
      physFixed: 346,
      attributeFixed: 188.6,
      extraCritDamage: 0,
      triggers: [],
    },
  ]
}

export function healSpearheavyHits(id: string, hits: unknown): unknown {
  if (id !== SPEARHEAVY_ID || !Array.isArray(hits) || hits.length !== SPEARHEAVY_OLD_ROWS.length) {
    return hits
  }
  const matches = hits.every((hit, index) => coefficientsMatch(hit, SPEARHEAVY_OLD_ROWS[index]!))
  return matches ? spearheavyStage2Hits() : hits
}

const SPEARHEAVY_OLD_CAST_FRAMES = 90
const SPEARHEAVY_NEW_CAST_FRAMES = 156

// A hits reshape that isn't paired with this stays broken: the new hits reach
// past frame 90. Only touches a castFrames still at the old seed's value.
export function healSpearheavyCastFrames(skill: Record<string, unknown>): unknown {
  if (skill.id !== SPEARHEAVY_ID || skill.castFrames !== SPEARHEAVY_OLD_CAST_FRAMES) return skill
  return { ...skill, castFrames: SPEARHEAVY_NEW_CAST_FRAMES }
}

const SPEARHEAVY_CHARGED_ATTUNE_TAG = "attune:spearCharged"

// Tied to the same hits reshape as `healSpearheavyCastFrames`: stage 2 gets
// neither the Charged attunement nor the Heavy-Attack tag.
export function healSpearheavyStage2Tags(skill: Record<string, unknown>): unknown {
  if (skill.id !== SPEARHEAVY_ID || !Array.isArray(skill.tags)) return skill
  const tags = skill.tags.filter(
    (tag) => tag !== SPEARHEAVY_CHARGED_ATTUNE_TAG && tag !== HEAVY_ATTACK_TAG,
  )
  return tags.length === skill.tags.length ? skill : { ...skill, tags }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const id = skill.id
  let next = skill

  if (id === "bellstrikeUmbra-spearq" && Array.isArray(next.hits)) {
    next = { ...next, hits: healSpearqRiverFlowTiers(next.hits) }
  }
  if (id === "bellstrikeUmbra-spearq-5-hit-cancel" && Array.isArray(next.hits)) {
    next = { ...next, hits: healSpearq5HitCancelRiverFlowTiers(next.hits) }
  }
  if (
    (id === "bellstrikeUmbra-spearspecial" || id === "bellstrikeUmbra-spearspecial-1-hit-cancel") &&
    Array.isArray(next.hits)
  ) {
    next = { ...next, hits: healSweepAllHits(next.hits) }
  }
  if (id === "bellstrikeUmbra-bleed-detonation" && Array.isArray(next.hits)) {
    next = { ...next, hits: healBleedDetonationHits(next.hits) }
  }
  if (Array.isArray(next.tags)) {
    next = {
      ...next,
      tags: healHeavyAttackTag(id, healCrosswindBladeTags(id, next.tags)),
    }
  }
  if (Array.isArray(next.hits)) {
    const reshapedHits = healSpearheavyHits(id, next.hits)
    if (reshapedHits !== next.hits) {
      next = healSpearheavyCastFrames({ ...next, hits: reshapedHits }) as typeof next
      next = healSpearheavyStage2Tags(next as Record<string, unknown>) as typeof next
    }
  }

  return next
}

export const V24__umbraValueFixes: CustomSkillMigration = {
  to: 24,
  name: "V24__umbraValueFixes",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 24, skills }
  },
}
