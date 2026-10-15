// v69 → v70 — Cloudstep lands its hit on frame 25 and casts 36 f (were 29 and
// 43), Relentless Chase's third strike lands its first hit on frame 18 (was
// 19) and Sword Light Attack's stage 3 last hit on frame 87 (was 88). Vagrant
// Sword's three-wave conditions also accept Wushuang Stance, and its
// three-wave release event spends it. A Skill Editor copy seeded before this
// still carries the old values. Only a value still identical to what was
// seeded is rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface Retiming {
  castFrames?: ValuePair
  hitFrames: readonly (ValuePair | null)[]
}

const VAGRANT_SWORD_ID = "bellstrikeSplendor-swordheavycharged"
const THREE_WAVE_RELEASE_EVENT_HIT_INDEX = 3
const WUSHUANG_STANCE_ID = "wushuangStance"

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const RETIMINGS: Readonly<Record<string, Retiming>> = {
  "bellstrikeSplendor-cloudstep": {
    castFrames: { from: 43, to: 36 },
    hitFrames: [{ from: 29, to: 25 }],
  },
  "bellstrikeSplendor-swordq-3rd": { hitFrames: [null, { from: 19, to: 18 }] },
  "bellstrikeSplendor-sword-light-attack": {
    hitFrames: [null, null, null, null, { from: 88, to: 87 }],
  },
}

const retimedHit = (hit: unknown, frames: ValuePair | null | undefined): unknown =>
  isRecord(hit) && frames && hit.frame === frames.from ? { ...hit, frame: frames.to } : hit

const isBuffCondition = (entry: unknown, buffId: string): boolean =>
  isRecord(entry) && entry.buffId === buffId

const withStanceAlternative = (condition: unknown): unknown => {
  if (!isRecord(condition) || !Array.isArray(condition.anyOf)) return condition
  const qiShieldIndex = condition.anyOf.findIndex((entry) => isBuffCondition(entry, "qiShield"))
  if (qiShieldIndex < 0) return condition
  if (condition.anyOf.some((entry) => isBuffCondition(entry, WUSHUANG_STANCE_ID))) return condition
  const stanceAlternative = { buffId: WUSHUANG_STANCE_ID, op: "gte", stacks: 1 }
  const anyOf = [
    ...condition.anyOf.slice(0, qiShieldIndex + 1),
    stanceAlternative,
    ...condition.anyOf.slice(qiShieldIndex + 1),
  ]
  return { ...condition, anyOf }
}

const withStanceAlternatives = (conditions: unknown): unknown =>
  Array.isArray(conditions) ? conditions.map(withStanceAlternative) : conditions

const spendsStance = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  trigger.kind === "applyBuff" &&
  trigger.targetId === WUSHUANG_STANCE_ID &&
  trigger.stacks === -1

const withStanceCondition = (hit: unknown, index: number): unknown => {
  if (!isRecord(hit)) return hit
  const healed: RecordValue = { ...hit }
  if (Array.isArray(hit.variants)) {
    healed.variants = hit.variants.map((variant) =>
      isRecord(variant) && variant.conditions !== undefined
        ? { ...variant, conditions: withStanceAlternatives(variant.conditions) }
        : variant,
    )
  }
  if (hit.conditions !== undefined) healed.conditions = withStanceAlternatives(hit.conditions)
  const isReleaseEvent =
    index === THREE_WAVE_RELEASE_EVENT_HIT_INDEX &&
    Array.isArray(hit.triggers) &&
    !hit.triggers.some(spendsStance)
  if (isReleaseEvent) {
    healed.triggers = [
      ...(hit.triggers as unknown[]),
      { condition: null, kind: "applyBuff", stacks: -1, targetId: WUSHUANG_STANCE_ID },
    ]
  }
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  if (skill.id === VAGRANT_SWORD_ID) {
    return { ...skill, hits: skill.hits.map(withStanceCondition) }
  }
  const retiming = RETIMINGS[skill.id]
  if (!retiming) return skill
  const castFrames =
    retiming.castFrames && skill.castFrames === retiming.castFrames.from
      ? retiming.castFrames.to
      : skill.castFrames
  return {
    ...skill,
    castFrames,
    hits: skill.hits.map((hit, index) => retimedHit(hit, retiming.hitFrames[index])),
  }
}

export const V70__splendorHitFrameRetiming: CustomSkillMigration = {
  to: 70,
  name: "V70__splendorHitFrameRetiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 70, skills }
  },
}
