// v75 → v76 — Vagrant Sword's level-2 charge releases 0.6 f later than the
// copy stores (the charge counts from the drain start, 12.6 f in), so the
// single bolt launches on frame 97 (was 0) and casts 122 (was 121), the three
// waves land on 91 / 101 / 130 after a 85 f release and cast 136 (were 90 /
// 100 / 129, 84 and 135), the second-wave form lands on 91 / 101 and casts 102
// (were 90 / 100 and 101) and the level-1 bolt launches on frame 58 and casts
// 83 (were 57 and 82) with its drain from frame 12.6. The bolts and waves now
// fly as projectiles, and none of the forms is available while Wushuang
// Stance holds. A Skill Editor copy seeded before this still carries the old
// values. Only a value still identical to what was seeded is rewritten: once
// it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface FormRetiming {
  castFrames: ValuePair
  hitFrames: readonly (ValuePair | null)[]
  variantFrames?: ValuePair
  variantCastFrames?: ValuePair
  projectileHitIndexes: readonly number[]
  drainFromFrame?: ValuePair
  seededConditions: readonly unknown[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const WAVE_PROJECTILE = { speedMetersPerSecond: 36, maxTravelFrames: 30 }
const STANCE_ABSENT = { buffId: "wushuangStance", op: "lt", stacks: 1 }
const WINDOW_OPEN = { buffId: "swordMorphMultiWaveWindow", op: "gte", stacks: 1 }

const FORMS: Readonly<Record<string, FormRetiming>> = {
  "bellstrikeSplendor-swordheavycharged": {
    castFrames: { from: 121, to: 122 },
    hitFrames: [
      { from: 0, to: 97 },
      { from: 100, to: 101 },
      { from: 129, to: 130 },
      { from: 84, to: 85 },
    ],
    variantFrames: { from: 90, to: 91 },
    variantCastFrames: { from: 135, to: 136 },
    projectileHitIndexes: [0, 1, 2],
    seededConditions: [],
  },
  "bellstrikeSplendor-swordheavycharged-2-hit": {
    castFrames: { from: 101, to: 102 },
    hitFrames: [
      { from: 90, to: 91 },
      { from: 100, to: 101 },
    ],
    projectileHitIndexes: [0, 1],
    seededConditions: [WINDOW_OPEN],
  },
  "bellstrikeSplendor-swordheavycharged-tier-1": {
    castFrames: { from: 82, to: 83 },
    hitFrames: [{ from: 57, to: 58 }],
    projectileHitIndexes: [],
    drainFromFrame: { from: 12, to: 12.6 },
    seededConditions: [],
  },
}

const retimed = (value: unknown, pair: ValuePair | null | undefined): unknown =>
  pair && value === pair.from ? pair.to : value

const withProjectile = (hit: RecordValue, index: number, form: FormRetiming): RecordValue =>
  form.projectileHitIndexes.includes(index) && hit.projectile === undefined
    ? { ...hit, projectile: { ...WAVE_PROJECTILE } }
    : hit

const retimedVariant = (variant: unknown, form: FormRetiming): unknown =>
  isRecord(variant)
    ? {
        ...variant,
        frame: retimed(variant.frame, form.variantFrames),
        castFrames: retimed(variant.castFrames, form.variantCastFrames),
      }
    : variant

const retimedHit = (hit: unknown, index: number, form: FormRetiming): unknown => {
  if (!isRecord(hit)) return hit
  const healed: RecordValue = withProjectile(
    { ...hit, frame: retimed(hit.frame, form.hitFrames[index]) },
    index,
    form,
  )
  if (Array.isArray(hit.variants)) {
    healed.variants = hit.variants.map((variant) => retimedVariant(variant, form))
  }
  return healed
}

const retimedDrain = (drain: unknown, form: FormRetiming): unknown =>
  isRecord(drain) ? { ...drain, fromFrame: retimed(drain.fromFrame, form.drainFromFrame) } : drain

const withStanceGate = (conditions: unknown, form: FormRetiming): unknown => {
  const stored = conditions ?? []
  const seeded = JSON.stringify(stored) === JSON.stringify(form.seededConditions)
  return seeded ? [...form.seededConditions, { ...STANCE_ABSENT }] : conditions
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const form = FORMS[skill.id]
  if (!form) return skill
  const healed: RecordValue = {
    ...skill,
    castFrames: retimed(skill.castFrames, form.castFrames),
    hits: skill.hits.map((hit, index) => retimedHit(hit, index, form)),
  }
  const conditions = withStanceGate(skill.castConditions, form)
  if (conditions !== skill.castConditions) healed.castConditions = conditions
  if (Array.isArray(skill.meterDrains)) {
    healed.meterDrains = skill.meterDrains.map((drain) => retimedDrain(drain, form))
  }
  return healed
}

export const V76__vagrantSwordChargeTiming: CustomSkillMigration = {
  to: 76,
  name: "V76__vagrantSwordChargeTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 76, skills }
  },
}
