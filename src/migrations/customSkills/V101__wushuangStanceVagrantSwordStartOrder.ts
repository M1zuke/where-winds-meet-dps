// v100 → v101 — under Wushuang Stance the Vagrant Sword charge starts 12.4 f in
// and releases on 60.4 f, so the three waves land on 66.46 / 76.42 / 105.7, the
// single bolt on 68.49 and the casts end on 111.4 / 85.2 (second-wave form
// 77.42), with the Endurance drain from 12.4 f. A Skill Editor copy seeded
// before this still carries the earlier values. Only a value still identical to
// what was seeded is rewritten: once it differs, a stale copy and a deliberate
// edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface FormRetiming {
  castFrames: ValuePair
  hitFrames: readonly ValuePair[]
  variantFrames?: ValuePair
  variantCastFrames?: ValuePair
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const DRAIN_START: ValuePair = { from: 12.6, to: 12.4 }

const FORMS: Readonly<Record<string, FormRetiming>> = {
  "bellstrikeSplendor-swordheavycharged-wushuang": {
    castFrames: { from: 84.8, to: 85.2 },
    hitFrames: [
      { from: 68.09, to: 68.49 },
      { from: 76.02, to: 76.42 },
      { from: 105.3, to: 105.7 },
      { from: 60, to: 60.4 },
    ],
    variantFrames: { from: 66.06, to: 66.46 },
    variantCastFrames: { from: 111, to: 111.4 },
  },
  "bellstrikeSplendor-swordheavycharged-2-hit-wushuang": {
    castFrames: { from: 77.02, to: 77.42 },
    hitFrames: [
      { from: 66.06, to: 66.46 },
      { from: 76.02, to: 76.42 },
      { from: 60, to: 60.4 },
    ],
  },
}

const retimed = (value: unknown, pair: ValuePair | undefined): unknown =>
  pair && value === pair.from ? pair.to : value

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
  const healed: RecordValue = { ...hit, frame: retimed(hit.frame, form.hitFrames[index]) }
  if (Array.isArray(hit.variants)) {
    healed.variants = hit.variants.map((variant) => retimedVariant(variant, form))
  }
  return healed
}

const retimedDrain = (drain: unknown): unknown =>
  isRecord(drain) ? { ...drain, fromFrame: retimed(drain.fromFrame, DRAIN_START) } : drain

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const form = FORMS[skill.id]
  if (!form) return skill
  const healed: RecordValue = {
    ...skill,
    castFrames: retimed(skill.castFrames, form.castFrames),
    hits: skill.hits.map((hit, index) => retimedHit(hit, index, form)),
  }
  if (Array.isArray(skill.meterDrains)) healed.meterDrains = skill.meterDrains.map(retimedDrain)
  return healed
}

export const V101__wushuangStanceVagrantSwordStartOrder: CustomSkillMigration = {
  to: 101,
  name: "V101__wushuangStanceVagrantSwordStartOrder",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 101, skills }
  },
}
