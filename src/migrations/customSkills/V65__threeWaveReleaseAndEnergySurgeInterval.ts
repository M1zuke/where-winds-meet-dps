// v64 → v65 — Vagrant Sword's three-wave release is decided once at the press
// (Sword Morph with the window or the Qi Shield held, or out of combat) and
// grants the window and Energy Surge at the release; Energy Surge's +20
// Endurance lands with its grant; its interval shortens per sword-energy
// bullet hit instead of per release attempted; Shadow Step opens the window at
// its cast start and Relentless Chase's Qi Shield no longer opens it; the
// pre-pull form is a single bolt without Sword Morph. A Skill Editor copy
// seeded before this still carries the old triggers. Only a skill whose
// grant still has the seeded shape is rewritten: once it differs, a stale copy
// and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) =>
    isRecord(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([left], [right]) => (left < right ? -1 : 1)),
        )
      : nested,
  )

const sameShape = (value: unknown, expected: unknown): boolean =>
  canonical(value) === canonical(expected)

const ENERGY_SURGE_GRANT_ID = "energySurgeGrant"
const WINDOW_ID = "swordMorphMultiWaveWindow"
const QI_SHIELD_ID = "qiShield"
const IN_COMBAT_ID = "inCombat"
const ENDURANCE_ID = "endurance"
const SWORD_MORPH_PARAM = "swordMorph"

const VAGRANT_SWORD_ID = "bellstrikeSplendor-swordheavycharged"
const VAGRANT_SWORD_2_HIT_ID = "bellstrikeSplendor-swordheavycharged-2-hit"
const VAGRANT_SWORD_PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"
const SHADOW_STEP_ID = "bellstrikeSplendor-swordspecial"
const RELENTLESS_CHASE_THIRD_ID = "bellstrikeSplendor-swordq-3rd"
const VAGRANT_SWORD_TIER_1_ID = "bellstrikeSplendor-swordheavycharged-tier-1"

const WINDOW_HELD = { buffId: WINDOW_ID, op: "gte", stacks: 1 }
const SWORD_MORPH_EQUIPPED = { param: SWORD_MORPH_PARAM }
const THREE_WAVE_CONDITIONS = [
  SWORD_MORPH_EQUIPPED,
  {
    anyOf: [
      WINDOW_HELD,
      { buffId: QI_SHIELD_ID, op: "gte", stacks: 1 },
      { buffId: IN_COMBAT_ID, op: "lt", stacks: 1 },
    ],
  },
]

const OLD_ENERGY_SURGE_GRANT = {
  kind: "applyBuff",
  targetId: ENERGY_SURGE_GRANT_ID,
  stacks: 1,
  condition: null,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: ENERGY_SURGE_GRANT_ID,
  durationFrames: 300,
  requiresParam: SWORD_MORPH_PARAM,
  requiresMinTier: 6,
}

const OLD_ENDURANCE_GAIN = {
  kind: "meterDelta",
  targetId: ENDURANCE_ID,
  stacks: 20,
  condition: null,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: ENERGY_SURGE_GRANT_ID,
  requiresParam: SWORD_MORPH_PARAM,
  requiresMinTier: 6,
}

const OLD_SUSTAIN = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: WINDOW_HELD,
  requiresParam: SWORD_MORPH_PARAM,
  requiresMinTier: 4,
}

const OLD_WINDOW_BOOTSTRAP = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: null,
  requiresParam: SWORD_MORPH_PARAM,
}

const withoutDecay = (trigger: RecordValue): RecordValue =>
  Object.fromEntries(
    Object.entries(trigger).filter(([key]) => key !== "cooldownDecayFramesPerAttempt"),
  )

const energySurgeGrant = (durationFrames: number) => ({
  ...withoutDecay(OLD_ENERGY_SURGE_GRANT),
  durationFrames,
})

const enduranceGain = withoutDecay(OLD_ENDURANCE_GAIN)

const windowReleaseGrant = {
  kind: "applyBuff",
  targetId: WINDOW_ID,
  stacks: 1,
  condition: null,
  requiresParam: SWORD_MORPH_PARAM,
  requiresMinTier: 4,
}

const COOLDOWN_CUT = {
  kind: "cooldownCut",
  targetId: ENERGY_SURGE_GRANT_ID,
  stacks: 60,
  condition: null,
  requiresParam: SWORD_MORPH_PARAM,
  requiresMinTier: 6,
}

const SINGLE_BOLT_ROW = {
  physMultiplier: 3.2664,
  attributeMultiplier: 4.8996,
  physFixed: 904,
  attributeFixed: 493,
}

const THREE_WAVE_FIRST_ROW = {
  physMultiplier: 1.3066,
  attributeMultiplier: 1.9598,
  physFixed: 361.6,
  attributeFixed: 197.2,
}

const FIRST_WAVE_AFTER_RELEASE_FRAMES = 6

const hasRow = (hit: RecordValue, row: Record<string, number>): boolean =>
  Object.entries(row).every(([key, value]) => hit[key] === value)

const triggersOf = (hit: unknown): unknown[] =>
  isRecord(hit) && Array.isArray(hit.triggers) ? hit.triggers : []

const hasCooldownCut = (triggers: unknown[]): boolean =>
  triggers.some((trigger) => isRecord(trigger) && trigger.kind === "cooldownCut")

const withCut = (hit: unknown): unknown => {
  if (!isRecord(hit)) return hit
  const triggers = triggersOf(hit)
  return hasCooldownCut(triggers) ? hit : { ...hit, triggers: [...triggers, COOLDOWN_CUT] }
}

const swapTriggers = (
  hit: unknown,
  swaps: readonly (readonly [unknown, unknown | null])[],
): unknown => {
  if (!isRecord(hit) || !Array.isArray(hit.triggers)) return hit
  const triggers = hit.triggers.flatMap((trigger) => {
    const swap = swaps.find(([from]) => sameShape(trigger, from))
    if (!swap) return [trigger]
    return swap[1] === null ? [] : [swap[1]]
  })
  return { ...hit, triggers }
}

const grantsOldEnergySurge = (hit: unknown): boolean =>
  triggersOf(hit).some((trigger) => sameShape(trigger, OLD_ENERGY_SURGE_GRANT))

const withConditions = (hit: unknown, expected: unknown[], next: unknown[]): unknown =>
  isRecord(hit) && Array.isArray(hit.conditions) && sameShape(hit.conditions, expected)
    ? { ...hit, conditions: next }
    : hit

function healVagrantSword(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, second, third] = hits
  if (hits.length !== 3 || !grantsOldEnergySurge(first) || !isRecord(first)) return skill
  const variants = Array.isArray(first.variants)
    ? first.variants.map((variant) =>
        isRecord(variant) && sameShape(variant.conditions, [WINDOW_HELD])
          ? { ...variant, conditions: THREE_WAVE_CONDITIONS }
          : variant,
      )
    : first.variants
  const releaseHit = {
    id: "hit-3",
    frame: 84,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [energySurgeGrant(300), windowReleaseGrant, enduranceGain],
    conditions: THREE_WAVE_CONDITIONS,
  }
  const healedThird = isRecord(third)
    ? {
        ...third,
        triggers: triggersOf(third).map((trigger) =>
          isRecord(trigger) &&
          trigger.kind === "meterDelta" &&
          sameShape(trigger.condition, WINDOW_HELD)
            ? { ...trigger, condition: null }
            : trigger,
        ),
      }
    : third
  return {
    ...skill,
    hits: [
      withCut({
        ...(swapTriggers(first, [
          [OLD_ENERGY_SURGE_GRANT, null],
          [OLD_SUSTAIN, null],
          [OLD_ENDURANCE_GAIN, null],
        ]) as RecordValue),
        variants,
      }),
      withCut(withConditions(second, [WINDOW_HELD], THREE_WAVE_CONDITIONS)),
      withCut(withConditions(healedThird, [WINDOW_HELD], THREE_WAVE_CONDITIONS)),
      releaseHit,
    ],
  }
}

function healVagrantSword2Hit(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  if (!grantsOldEnergySurge(first)) return skill
  const lateEnergySurgeGrant = energySurgeGrant(300 - FIRST_WAVE_AFTER_RELEASE_FRAMES)
  const lateWindowGrant = {
    ...windowReleaseGrant,
    durationFrames: 300 - FIRST_WAVE_AFTER_RELEASE_FRAMES,
  }
  const healedFirst = swapTriggers(first, [
    [OLD_ENERGY_SURGE_GRANT, lateEnergySurgeGrant],
    [OLD_SUSTAIN, lateWindowGrant],
    [OLD_ENDURANCE_GAIN, enduranceGain],
  ])
  return { ...skill, hits: [withCut(healedFirst), ...rest.map(withCut)] }
}

function healPrepull(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  if (
    !isRecord(first) ||
    !grantsOldEnergySurge(first) ||
    first.variants !== undefined ||
    first.frame !== 0 ||
    !hasRow(first, THREE_WAVE_FIRST_ROW)
  )
    return skill
  const swordMorphVariant = {
    id: "hv-swordheavycharged-prepull-hit-0-sword-morph",
    label: "Sword Morph",
    conditions: [SWORD_MORPH_EQUIPPED],
    ...THREE_WAVE_FIRST_ROW,
    castFrames: 51,
    frame: 0,
  }
  const healedFirst = swapTriggers(first, [
    [OLD_ENERGY_SURGE_GRANT, energySurgeGrant(300)],
    [OLD_ENDURANCE_GAIN, enduranceGain],
  ]) as RecordValue
  const gatedRest = rest.map((hit) =>
    isRecord(hit) && hit.conditions === undefined
      ? withCut({ ...hit, conditions: [SWORD_MORPH_EQUIPPED] })
      : hit,
  )
  return {
    ...skill,
    castFrames: skill.castFrames === 51 ? 37 : skill.castFrames,
    hits: [
      withCut({ ...healedFirst, ...SINGLE_BOLT_ROW, frame: 12, variants: [swordMorphVariant] }),
      ...gatedRest,
    ],
  }
}

function healEnergySurge(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  if (!grantsOldEnergySurge(first)) return skill
  const healedFirst = swapTriggers(first, [
    [OLD_ENERGY_SURGE_GRANT, energySurgeGrant(300)],
    [OLD_ENDURANCE_GAIN, enduranceGain],
  ])
  return { ...skill, hits: [withCut(healedFirst), ...rest.map(withCut)] }
}

function healShadowStep(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  if (!triggersOf(first).some((trigger) => sameShape(trigger, OLD_WINDOW_BOOTSTRAP))) return skill
  const healedFirst = swapTriggers(first, [
    [OLD_WINDOW_BOOTSTRAP, { ...OLD_WINDOW_BOOTSTRAP, durationFrames: 300 - 23 }],
  ])
  return { ...skill, hits: [withCut(healedFirst), ...rest] }
}

function healRelentlessChaseThird(skill: RecordValue, hits: unknown[]): RecordValue {
  return {
    ...skill,
    hits: hits.map((hit) => swapTriggers(hit, [[OLD_WINDOW_BOOTSTRAP, null]])),
  }
}

function healTier1(skill: RecordValue, hits: unknown[]): RecordValue {
  const [first, ...rest] = hits
  return isRecord(first) ? { ...skill, hits: [withCut(first), ...rest] } : skill
}

const HEALS_BY_SKILL_ID: Record<string, (skill: RecordValue, hits: unknown[]) => RecordValue> = {
  [VAGRANT_SWORD_ID]: healVagrantSword,
  [VAGRANT_SWORD_2_HIT_ID]: healVagrantSword2Hit,
  [VAGRANT_SWORD_PREPULL_ID]: healPrepull,
  [ENERGY_SURGE_ID]: healEnergySurge,
  [SHADOW_STEP_ID]: healShadowStep,
  [RELENTLESS_CHASE_THIRD_ID]: healRelentlessChaseThird,
  [VAGRANT_SWORD_TIER_1_ID]: healTier1,
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const heal = HEALS_BY_SKILL_ID[skill.id]
  return heal ? heal(skill, skill.hits) : skill
}

export const V65__threeWaveReleaseAndEnergySurgeInterval: CustomSkillMigration = {
  to: 65,
  name: "V65__threeWaveReleaseAndEnergySurgeInterval",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 65, skills }
  },
}
