// v98 → v99 — Burning Heart's second and third stage are no longer flagged illegal
// when Blade Momentum is short: the charge releases stage 1, reading Blade
// Momentum where the charge starts, and the Blade Momentum is spent at the
// release instead of at the press. The charge also drains Endurance while it is
// held. A Skill Editor copy seeded before this still carries the old gate and
// cost. Only a copy whose gate and cost are still identical to what was seeded is
// rewritten: once they differ, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ChargeFields {
  castConditions?: unknown[]
  meterCosts: unknown[]
  meterDrains?: unknown[]
  releaseGates?: unknown[]
}

interface ChargeRewrite {
  from: ChargeFields
  to: ChargeFields
}

const BLADE_MOMENTUM = "bladeMomentum"
const ENDURANCE = "endurance"
const PARAM = "steadfastDevotion"
const CHARGE_START_FRAME = 19.32
const STAGE_1_ID = "stonesplitStrength-phalanxcharged-s1"
const STAGE_2_ID = "stonesplitStrength-phalanxcharged-s2"
const STAGE_2_INNER_PASSION_ID = "stonesplitStrength-phalanxcharged-s2-innerpassion"

const bladeMomentumAbove = (stacks: number) => ({
  buffId: `meter:${BLADE_MOMENTUM}`,
  op: "gt",
  stacks,
})
const steadfastDevotionFrom = (minTier: number) => ({ param: PARAM, minTier })
const innerPassionCondition = {
  anyOf: [steadfastDevotionFrom(4), bladeMomentumAbove(25)],
}

const plainGate = [
  { atFrame: CHARGE_START_FRAME, requires: [bladeMomentumAbove(50)], fallbackSkillId: STAGE_1_ID },
]
const innerPassionGate = [
  { atFrame: CHARGE_START_FRAME, requires: [innerPassionCondition], fallbackSkillId: STAGE_1_ID },
]

const enduranceDrain = (stopAfterSec: number, fallbackSkillId: string) => [
  {
    meterId: ENDURANCE,
    perSecond: 5,
    fromFrame: CHARGE_START_FRAME,
    stopAfterSec,
    chargeRelease: { fallbackSkillId },
  },
]

const plainCost = (atFrame?: number) => [
  { meterId: BLADE_MOMENTUM, amount: 50, ...(atFrame === undefined ? {} : { atFrame }) },
]
const innerPassionCost = (atFrame?: number) => [
  {
    meterId: BLADE_MOMENTUM,
    amount: 25,
    ...(atFrame === undefined ? {} : { atFrame }),
    requiresParam: PARAM,
    requiresMaxTier: 3,
  },
]

const REWRITES: Readonly<Record<string, ChargeRewrite>> = {
  [STAGE_2_ID]: {
    from: { castConditions: [bladeMomentumAbove(50)], meterCosts: plainCost() },
    to: {
      meterCosts: plainCost(76.32),
      meterDrains: enduranceDrain(57 / 60, STAGE_1_ID),
      releaseGates: plainGate,
    },
  },
  "stonesplitStrength-phalanxcharged-s3": {
    from: {
      castConditions: [steadfastDevotionFrom(1), bladeMomentumAbove(50)],
      meterCosts: plainCost(),
    },
    to: {
      castConditions: [steadfastDevotionFrom(1)],
      meterCosts: plainCost(112.32),
      meterDrains: enduranceDrain(93 / 60, STAGE_2_ID),
      releaseGates: plainGate,
    },
  },
  [STAGE_2_INNER_PASSION_ID]: {
    from: { castConditions: [innerPassionCondition], meterCosts: innerPassionCost() },
    to: {
      meterCosts: innerPassionCost(57.32),
      meterDrains: enduranceDrain(38 / 60, STAGE_1_ID),
      releaseGates: innerPassionGate,
    },
  },
  "stonesplitStrength-phalanxcharged-s3-innerpassion": {
    from: {
      castConditions: [steadfastDevotionFrom(1), innerPassionCondition],
      meterCosts: innerPassionCost(),
    },
    to: {
      castConditions: [steadfastDevotionFrom(1)],
      meterCosts: innerPassionCost(81.32),
      meterDrains: enduranceDrain(62 / 60, STAGE_2_INNER_PASSION_ID),
      releaseGates: innerPassionGate,
    },
  },
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

function sameValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right))
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((entry, index) => sameValue(entry, right[index]))
    )
  if (isRecord(left) && isRecord(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    return [...keys].every((key) => sameValue(left[key], right[key]))
  }
  return left === right
}

const seededShape = (skill: RecordValue, from: ChargeFields): boolean =>
  sameValue(skill.castConditions, from.castConditions) &&
  sameValue(skill.meterCosts, from.meterCosts) &&
  skill.meterDrains === undefined &&
  skill.releaseGates === undefined

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const rewrite = REWRITES[skill.id]
  if (!rewrite || !seededShape(skill, rewrite.from)) return skill
  const { castConditions: _gate, ...withoutGate } = skill
  void _gate
  return {
    ...withoutGate,
    ...(rewrite.to.castConditions ? { castConditions: rewrite.to.castConditions } : {}),
    meterCosts: rewrite.to.meterCosts,
    meterDrains: rewrite.to.meterDrains,
    releaseGates: rewrite.to.releaseGates,
  }
}

export const V99__burningHeartChargeStageGates: CustomSkillMigration = {
  to: 99,
  name: "V99__burningHeartChargeStageGates",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 99, skills }
  },
}
