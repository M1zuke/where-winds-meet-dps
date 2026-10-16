// v99 → v100 — a Burning Heart cast cut down to stage 1 by short Blade Momentum or
// an emptied Endurance releases onto its own stage-1 form, timed from where the
// charge would have started, instead of onto the tapped stage 1. A Skill Editor
// copy seeded before this still names the tapped form in its release gate and
// Endurance drain. Only a copy whose gate and drain are still identical to what
// was seeded is rewritten: once they differ, a stale copy and a deliberate edit
// are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ReleaseFields {
  releaseGates: unknown[]
  meterDrains: unknown[]
}

const ENDURANCE = "endurance"
const PARAM = "steadfastDevotion"
const CHARGE_START_FRAME = 19.32
const TAPPED_STAGE_1_ID = "stonesplitStrength-phalanxcharged-s1"
const RELEASED_STAGE_1_ID = "stonesplitStrength-phalanxcharged-s1-released"
const STAGE_2_ID = "stonesplitStrength-phalanxcharged-s2"
const STAGE_2_INNER_PASSION_ID = "stonesplitStrength-phalanxcharged-s2-innerpassion"

const bladeMomentumAbove = (stacks: number) => ({
  buffId: "meter:bladeMomentum",
  op: "gt",
  stacks,
})
const innerPassionCondition = {
  anyOf: [{ param: PARAM, minTier: 4 }, bladeMomentumAbove(25)],
}

const gate = (condition: unknown, fallbackSkillId: string) => [
  { atFrame: CHARGE_START_FRAME, requires: [condition], fallbackSkillId },
]
const drain = (stopAfterSec: number, fallbackSkillId: string) => [
  {
    meterId: ENDURANCE,
    perSecond: 5,
    fromFrame: CHARGE_START_FRAME,
    stopAfterSec,
    chargeRelease: { fallbackSkillId },
  },
]

const fields = (
  gateFallback: string,
  condition: unknown,
  stopAfterSec: number,
  drainFallback: string,
): ReleaseFields => ({
  releaseGates: gate(condition, gateFallback),
  meterDrains: drain(stopAfterSec, drainFallback),
})

const REWRITES: Readonly<Record<string, { from: ReleaseFields; to: ReleaseFields }>> = {
  [STAGE_2_ID]: {
    from: fields(TAPPED_STAGE_1_ID, bladeMomentumAbove(50), 57 / 60, TAPPED_STAGE_1_ID),
    to: fields(RELEASED_STAGE_1_ID, bladeMomentumAbove(50), 57 / 60, RELEASED_STAGE_1_ID),
  },
  "stonesplitStrength-phalanxcharged-s3": {
    from: fields(TAPPED_STAGE_1_ID, bladeMomentumAbove(50), 93 / 60, STAGE_2_ID),
    to: fields(RELEASED_STAGE_1_ID, bladeMomentumAbove(50), 93 / 60, STAGE_2_ID),
  },
  [STAGE_2_INNER_PASSION_ID]: {
    from: fields(TAPPED_STAGE_1_ID, innerPassionCondition, 38 / 60, TAPPED_STAGE_1_ID),
    to: fields(RELEASED_STAGE_1_ID, innerPassionCondition, 38 / 60, RELEASED_STAGE_1_ID),
  },
  "stonesplitStrength-phalanxcharged-s3-innerpassion": {
    from: fields(TAPPED_STAGE_1_ID, innerPassionCondition, 62 / 60, STAGE_2_INNER_PASSION_ID),
    to: fields(RELEASED_STAGE_1_ID, innerPassionCondition, 62 / 60, STAGE_2_INNER_PASSION_ID),
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

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const rewrite = REWRITES[skill.id]
  if (
    !rewrite ||
    !sameValue(skill.releaseGates, rewrite.from.releaseGates) ||
    !sameValue(skill.meterDrains, rewrite.from.meterDrains)
  )
    return skill
  return { ...skill, ...structuredClone(rewrite.to) }
}

export const V100__burningHeartLowStageReleaseTiming: CustomSkillMigration = {
  to: 100,
  name: "V100__burningHeartLowStageReleaseTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 100, skills }
  },
}
