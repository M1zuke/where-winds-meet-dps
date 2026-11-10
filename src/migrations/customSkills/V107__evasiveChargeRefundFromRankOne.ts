// v106 → v107 — the Evasive Charge Endurance refund is one 70% trigger from
// rank 1 up. Skill Editor copies of the Perfect Dodge skills seeded before this
// carry two: 50% from rank 1, plus 20% more from rank 2. The pair is merged
// only while both still hold the seeded values: once either differs, a stale
// copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isRefund = (trigger: unknown, fraction: number, minTier: number | undefined): boolean =>
  isRecord(trigger) &&
  trigger.kind === "meterDelta" &&
  trigger.targetId === "endurance" &&
  trigger.requiresParam === "evasiveCharge" &&
  trigger.refundFractionOfCastCost === fraction &&
  trigger.requiresMinTier === minTier

const isBaseRefund = (trigger: unknown) => isRefund(trigger, 0.5, undefined)
const isRankTwoRefund = (trigger: unknown) => isRefund(trigger, 0.2, 2)

function healTriggers(triggers: unknown[]): unknown[] {
  if (!triggers.some(isBaseRefund) || !triggers.some(isRankTwoRefund)) return triggers
  return triggers
    .filter((trigger) => !isRankTwoRefund(trigger))
    .map((trigger) =>
      isBaseRefund(trigger)
        ? { ...(trigger as RecordValue), refundFractionOfCastCost: 0.7 }
        : trigger,
    )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || !Array.isArray(skill.hits)) return skill
  return {
    ...skill,
    hits: skill.hits.map((hit) =>
      isRecord(hit) && Array.isArray(hit.triggers)
        ? { ...hit, triggers: healTriggers(hit.triggers) }
        : hit,
    ),
  }
}

export const V107__evasiveChargeRefundFromRankOne: CustomSkillMigration = {
  to: 107,
  name: "V107__evasiveChargeRefundFromRankOne",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 107, skills }
  },
}
