// v82 → v83 — Splendor's Qi Imbalance lands on the hit that applies it and not
// at all on a cast that lands no hit, the plain Endless Gale restarts at
// Qiankun's Lock's end and is dispelled by Mountain's Might's, Qiankun's
// Lock's cast-start grants sit on a hit of their own, Daunting Strike and
// Relentless Chase end where an Energy Surge or a Deflect cuts them, and the
// flying sword, Energy Surge's waves and Shadow Step's bolt land after their
// flight with the cast-wide grants on hits of their own. A Skill Editor copy
// seeded before this still carries the old shape. A copy is rewritten only
// while every part of it still matches what was seeded: once one differs, a
// stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SPEAR_Q_ID = "bellstrikeSplendor-spearq"
const SPEAR_Q_PREPULL_ID = "bellstrikeSplendor-spearq-prepull"
const SPEAR_Q_0_HIT_CANCEL_ID = "bellstrikeSplendor-spearq-0-hit-cancel"
const SWORD_Q_ID = "bellstrikeSplendor-swordq"
const SWORD_Q_2ND_ID = "bellstrikeSplendor-swordq-2nd"
const SWORD_Q_3RD_ID = "bellstrikeSplendor-swordq-3rd"
const LEGION_CRUSHER_ID = "bellstrikeSplendor-legioncrusher"
const ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"
const SHADOW_STEP_ID = "bellstrikeSplendor-swordspecial"

const QI_IMBALANCE = "qiImbalance"
const SPEAR_QI_IMBALANCE_APPLIER = "qiankunsLockQiImbalance"
const SWORD_QI_IMBALANCE_APPLIER = "mountainsMightQiImbalance"
const MOUNTAINS_MIGHT_PARAM = "mountainsMight"
const ENERGY_SURGE_OR_DEFLECT = [
  "bellstrikeSplendor-energysurge",
  "bellstrikeSplendor-deflect-cancel",
]

const SPEAR_Q_HIT_FRAME = 18
const SWORD_Q_CAST_FRAMES = { from: 26, to: 55 }
const SWORD_Q_CUT = { frame: 18, castFrames: 19 }
const SWORD_Q_HIT_FRAME = { from: 22, to: 18 }
const DAUNTING_STRIKE_PROJECTILE = { speedMetersPerSecond: 40, maxTravelFrames: 19.5 }
const SHADOW_STEP_PROJECTILE = { speedMetersPerSecond: 32, maxTravelFrames: 24 }
const WAVE_PROJECTILE = { speedMetersPerSecond: 36, maxTravelFrames: 30 }
const ENERGY_SURGE_WAVE_FRAMES = [6, 16, 45]
const ENERGY_SURGE_EVENT_SIGNATURES = [
  "applyBuff:energySurgeGrant:-1",
  "applyBuff:energySurgeGrant:1",
  "applyBuff:swordMorphMultiWaveWindow:1",
  "meterDelta:endurance:-20",
  "meterDelta:endurance:10",
  "meterDelta:endurance:20",
  "cooldownCut:energySurgeGrant:60",
]
const SHADOW_STEP_HIT = { from: 23, to: 17 }
const SHADOW_STEP_SIGNATURES = [
  "applyBuff:swordMorphMultiWaveWindow:1",
  "applyBuff:shadowStepDashWindow:1",
  "cooldownCut:energySurgeGrant:60",
]
const SHADOW_STEP_WINDOW_DURATIONS = {
  multiWave: { from: 277, to: 300 },
  dash: { from: 144, to: 150 },
}

const SWORD_Q_2ND_CUT = { frame: 49, castFrames: 50 }
const SWORD_Q_2ND_WINDOW_GRANT_FRAME = 1
const SWORD_Q_3RD_CUT = { frame: 65, castFrames: 66 }

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameList = (value: unknown, expected: readonly unknown[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  expected.every((entry, index) => value[index] === entry)

const sameTrigger = (value: unknown, expected: RecordValue): boolean =>
  isRecord(value) &&
  Object.keys(expected).every(
    (key) => JSON.stringify(value[key]) === JSON.stringify(expected[key]),
  ) &&
  Object.keys(value).every((key) => key in expected)

const OLD_SPEAR_GAIN = { kind: "meterDelta", targetId: "endurance", stacks: 30, condition: null }
const OLD_SPEAR_MOUNTAINS_MIGHT_GAIN = {
  ...OLD_SPEAR_GAIN,
  requiresParam: MOUNTAINS_MIGHT_PARAM,
}
const OLD_START_GRANT = {
  kind: "applyBuff",
  targetId: "endlessGaleAtStart",
  stacks: 1,
  condition: null,
}
const END_GRANT = {
  kind: "applyBuff",
  targetId: "endlessGale",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
}
const MOUNTAINS_MIGHT_EXTEND = {
  ...END_GRANT,
  extendFrames: 300,
  requiresParam: MOUNTAINS_MIGHT_PARAM,
}
const COST_REDUCTION_END = {
  kind: "applyBuff",
  targetId: "endlessGaleCostReductionEnd",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
  requiresParam: MOUNTAINS_MIGHT_PARAM,
}
const OLD_SPEAR_MARKER = {
  kind: "applyBuff",
  targetId: "qiImbalanceMarker",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
}
const OLD_SWORD_MARKER = { ...OLD_SPEAR_MARKER, requiresParam: MOUNTAINS_MIGHT_PARAM }

const CAPPED_MOUNTAINS_MIGHT_EXTEND = {
  ...MOUNTAINS_MIGHT_EXTEND,
  maxExtendedDurationFrames: 600,
}
const NEW_START_GRANT = {
  ...OLD_START_GRANT,
  condition: { buffId: "endlessGaleCostReductionEnd", op: "lte", stacks: 0 },
}
const START_RESTART = {
  ...OLD_START_GRANT,
  extendFrames: 300,
  maxExtendedDurationFrames: 300,
  appliesOnCastEnd: true,
  extendOnly: true,
}
const START_DISPEL = {
  kind: "clearStatus",
  targetId: "endlessGaleAtStart",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
  requiresParam: MOUNTAINS_MIGHT_PARAM,
}
const NEW_SPEAR_MARKER = {
  kind: "applyBuff",
  targetId: "qiImbalanceMarker",
  stacks: 1,
  condition: null,
}
const NEW_SWORD_MARKER = { ...NEW_SPEAR_MARKER, requiresParam: MOUNTAINS_MIGHT_PARAM }

const OLD_SPEAR_TRIGGERS = [
  OLD_SPEAR_GAIN,
  OLD_SPEAR_MOUNTAINS_MIGHT_GAIN,
  OLD_START_GRANT,
  END_GRANT,
  MOUNTAINS_MIGHT_EXTEND,
  COST_REDUCTION_END,
  OLD_SPEAR_MARKER,
]
const NEW_SPEAR_SKILL_TRIGGERS = [
  OLD_SPEAR_GAIN,
  OLD_SPEAR_MOUNTAINS_MIGHT_GAIN,
  NEW_START_GRANT,
  START_RESTART,
  END_GRANT,
  CAPPED_MOUNTAINS_MIGHT_EXTEND,
  COST_REDUCTION_END,
  START_DISPEL,
]

const hasTriggers = (hit: unknown, expected: readonly RecordValue[]): boolean =>
  isRecord(hit) &&
  Array.isArray(hit.triggers) &&
  hit.triggers.length === expected.length &&
  expected.every((trigger, index) => sameTrigger((hit.triggers as unknown[])[index], trigger))

const withTriggers = (hit: unknown, triggers: readonly RecordValue[]): RecordValue => ({
  ...(hit as RecordValue),
  triggers: triggers.map((trigger) => ({ ...trigger })),
})

const withReceive = (receives: unknown, buffId: string): unknown =>
  Array.isArray(receives) && !receives.includes(buffId) ? [...receives, buffId] : receives

const signatureOf = (trigger: unknown): string =>
  isRecord(trigger) ? `${trigger.kind}:${trigger.targetId}:${trigger.stacks}` : ""

const hasSignatures = (hit: unknown, expected: readonly string[]): boolean =>
  isRecord(hit) && Array.isArray(hit.triggers) && sameList(hit.triggers.map(signatureOf), expected)

const seededHits = (skill: RecordValue, frames: readonly number[]): RecordValue[] | null => {
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== frames.length) return null
  const matches = frames.every(
    (frame, index) => isRecord(hits[index]) && hits[index].frame === frame,
  )
  return matches ? (hits as RecordValue[]) : null
}

const zeroHit = (index: number, frame: number, extra: RecordValue): RecordValue => ({
  id: `hit-${index}`,
  frame,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [],
  ...extra,
})

const castCutHit = (index: number, frame: number, castFrames: number): RecordValue =>
  zeroHit(index, frame, {
    requiresNextStepSkillIds: [...ENERGY_SURGE_OR_DEFLECT],
    castFramesWhenGated: castFrames,
  })

const copyOf = (trigger: RecordValue): RecordValue => ({ ...trigger })

function healSpearQ(skill: RecordValue): unknown {
  const hits = seededHits(skill, [SPEAR_Q_HIT_FRAME])
  if (
    !hits ||
    !sameList(skill.triggersBuffs, ["jadeware", "mountainsMight", QI_IMBALANCE]) ||
    !hasTriggers(hits[0], OLD_SPEAR_TRIGGERS)
  )
    return skill
  const skillEvents = zeroHit(0, 0, { triggers: NEW_SPEAR_SKILL_TRIGGERS.map(copyOf) })
  const landing = { ...withTriggers(hits[0], [NEW_SPEAR_MARKER]), id: "hit-1" }
  return {
    ...skill,
    triggersBuffs: ["jadeware", "mountainsMight"],
    receives: withReceive(skill.receives, SPEAR_QI_IMBALANCE_APPLIER),
    hits: [skillEvents, landing],
  }
}

function healSpearQWithoutHit(skill: RecordValue): unknown {
  const hits = seededHits(skill, [0])
  if (
    !hits ||
    !sameList(skill.triggersBuffs, ["jadeware", "mountainsMight", QI_IMBALANCE]) ||
    !hasTriggers(hits[0], OLD_SPEAR_TRIGGERS)
  )
    return skill
  return {
    ...skill,
    triggersBuffs: ["jadeware", "mountainsMight"],
    hits: [withTriggers(hits[0], NEW_SPEAR_SKILL_TRIGGERS)],
  }
}

function healSwordQ(skill: RecordValue): unknown {
  const hits = seededHits(skill, [SWORD_Q_HIT_FRAME.from])
  if (
    !hits ||
    skill.castFrames !== SWORD_Q_CAST_FRAMES.from ||
    !sameList(skill.triggersBuffs, ["jadeware", SWORD_QI_IMBALANCE_APPLIER]) ||
    !hasTriggers(hits[0], [OLD_SWORD_MARKER])
  )
    return skill
  return {
    ...skill,
    castFrames: SWORD_Q_CAST_FRAMES.to,
    triggersBuffs: ["jadeware"],
    receives: withReceive(skill.receives, SWORD_QI_IMBALANCE_APPLIER),
    hits: [
      {
        ...withTriggers(hits[0], [NEW_SWORD_MARKER]),
        frame: SWORD_Q_HIT_FRAME.to,
        projectile: { ...DAUNTING_STRIKE_PROJECTILE },
      },
      castCutHit(1, SWORD_Q_CUT.frame, SWORD_Q_CUT.castFrames),
    ],
  }
}

function healSwordQ2nd(skill: RecordValue): unknown {
  const hits = seededHits(skill, [7, 48])
  if (
    !hits ||
    !sameList(skill.triggersBuffs, ["jadeware", SWORD_QI_IMBALANCE_APPLIER]) ||
    !hasSignatures(hits[0], ["applyBuff:relentlessChaseWindow:1"]) ||
    !hasTriggers(hits[1], [OLD_SWORD_MARKER])
  )
    return skill
  const [windowGrant] = (hits[0]!.triggers as RecordValue[]).map(copyOf)
  return {
    ...skill,
    triggersBuffs: ["jadeware"],
    receives: withReceive(skill.receives, SWORD_QI_IMBALANCE_APPLIER),
    hits: [
      withTriggers(hits[0], [NEW_SWORD_MARKER]),
      withTriggers(hits[1], [NEW_SWORD_MARKER]),
      castCutHit(2, SWORD_Q_2ND_CUT.frame, SWORD_Q_2ND_CUT.castFrames),
      zeroHit(3, SWORD_Q_2ND_WINDOW_GRANT_FRAME, { triggers: [windowGrant] }),
    ],
  }
}

function healSwordQ3rd(skill: RecordValue): unknown {
  const hits = seededHits(skill, [0, 18, 34, 64, 60])
  if (
    !hits ||
    !sameList(skill.triggersBuffs, ["jadeware", SWORD_QI_IMBALANCE_APPLIER]) ||
    !hasTriggers(hits[1], []) ||
    !hasTriggers(hits[2], []) ||
    !hasTriggers(hits[3], [OLD_SWORD_MARKER])
  )
    return skill
  return {
    ...skill,
    triggersBuffs: ["jadeware"],
    receives: withReceive(skill.receives, SWORD_QI_IMBALANCE_APPLIER),
    hits: [
      hits[0],
      withTriggers(hits[1], [NEW_SWORD_MARKER]),
      withTriggers(hits[2], [NEW_SWORD_MARKER]),
      withTriggers(hits[3], [NEW_SWORD_MARKER]),
      hits[4],
      castCutHit(5, SWORD_Q_3RD_CUT.frame, SWORD_Q_3RD_CUT.castFrames),
    ],
  }
}

const OLD_LEGION_CRUSHER_GRANT = {
  ...OLD_START_GRANT,
  condition: { buffId: "endlessGale", op: "lte", stacks: 0 },
}

function healLegionCrusher(skill: RecordValue): unknown {
  const hits = seededHits(skill, [0, 20])
  if (!hits || !hasTriggers(hits[0], [OLD_LEGION_CRUSHER_GRANT])) return skill
  return { ...skill, hits: [withTriggers(hits[0], [NEW_START_GRANT]), hits[1]] }
}

function healEnergySurge(skill: RecordValue): unknown {
  const hits = seededHits(skill, ENERGY_SURGE_WAVE_FRAMES)
  if (
    !hits ||
    !hasSignatures(hits[0], ENERGY_SURGE_EVENT_SIGNATURES) ||
    !hasSignatures(hits[1], ["cooldownCut:energySurgeGrant:60"]) ||
    !hasSignatures(hits[2], ["cooldownCut:energySurgeGrant:60"])
  )
    return skill
  const [consume, release, windowGrant, spend, battleAnthemGain, enduranceGain, cut] = (
    hits[0]!.triggers as RecordValue[]
  ).map(copyOf)
  return {
    ...skill,
    hits: [
      { ...hits[0], projectile: { ...WAVE_PROJECTILE }, triggers: [battleAnthemGain, cut] },
      { ...hits[1], projectile: { ...WAVE_PROJECTILE } },
      { ...hits[2], projectile: { ...WAVE_PROJECTILE } },
      zeroHit(3, 0, { triggers: [consume, release, windowGrant, spend, enduranceGain] }),
    ],
  }
}

function healShadowStep(skill: RecordValue): unknown {
  const hits = seededHits(skill, [SHADOW_STEP_HIT.from])
  if (!hits || !hasSignatures(hits[0], SHADOW_STEP_SIGNATURES)) return skill
  const [multiWave, dash, cut] = (hits[0]!.triggers as RecordValue[]).map(copyOf)
  if (
    multiWave!.durationFrames !== SHADOW_STEP_WINDOW_DURATIONS.multiWave.from ||
    dash!.durationFrames !== SHADOW_STEP_WINDOW_DURATIONS.dash.from
  )
    return skill
  return {
    ...skill,
    hits: [
      {
        ...hits[0],
        frame: SHADOW_STEP_HIT.to,
        projectile: { ...SHADOW_STEP_PROJECTILE },
        triggers: [cut],
      },
      zeroHit(1, 0, {
        triggers: [{ ...multiWave, durationFrames: SHADOW_STEP_WINDOW_DURATIONS.multiWave.to }],
      }),
      zeroHit(2, SHADOW_STEP_HIT.to, {
        triggers: [{ ...dash, durationFrames: SHADOW_STEP_WINDOW_DURATIONS.dash.to }],
      }),
    ],
  }
}

const HEALERS: Readonly<Record<string, (skill: RecordValue) => unknown>> = {
  [SPEAR_Q_ID]: healSpearQ,
  [SPEAR_Q_PREPULL_ID]: healSpearQWithoutHit,
  [SPEAR_Q_0_HIT_CANCEL_ID]: healSpearQWithoutHit,
  [SWORD_Q_ID]: healSwordQ,
  [SWORD_Q_2ND_ID]: healSwordQ2nd,
  [SWORD_Q_3RD_ID]: healSwordQ3rd,
  [LEGION_CRUSHER_ID]: healLegionCrusher,
  [ENERGY_SURGE_ID]: healEnergySurge,
  [SHADOW_STEP_ID]: healShadowStep,
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const healer = HEALERS[skill.id]
  return healer ? healer(skill) : skill
}

export const V83__splendorQiImbalanceOnHitAndEndlessGaleWindow: CustomSkillMigration = {
  to: 83,
  name: "V83__splendorQiImbalanceOnHitAndEndlessGaleWindow",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 83, skills }
  },
}
