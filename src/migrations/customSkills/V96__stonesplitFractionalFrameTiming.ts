// v95 → v96 — Total Annihilation lands its strike 18.65 f after its lead
// (Supreme: 14.36 f after a 179.76 f lead) and ends 42 f after it, and the
// Mo Blade drawn Deflect casts 18.06 f; the whole-frame values (26, 194, 222,
// 180, 18) are replaced. A Skill Editor copy seeded before this still carries
// them. Only a value still identical to what was seeded is rewritten: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface Retiming {
  castFrames?: ValuePair
  hitFrame?: ValuePair
  variantCastFrames?: ValuePair
  grantFrames?: Readonly<Record<string, ValuePair>>
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const MO_BLADE_DEFLECT_CAST: ValuePair = { from: 18, to: 18.06 }

const RETIMINGS: Readonly<Record<string, Retiming>> = {
  "stonesplitStrength-phalanxq": { hitFrame: { from: 26, to: 25.65 } },
  "stonesplitStrength-phalanxq-supreme": {
    castFrames: { from: 222, to: 221.76 },
    hitFrame: { from: 194, to: 194.12 },
    grantFrames: {
      totalAnnihilationSupremeShield: { from: 222, to: 221.76 },
      jadeware: { from: 180, to: 179.76 },
    },
  },
  "stonesplitStrength-deflect": { variantCastFrames: MO_BLADE_DEFLECT_CAST },
  "stonesplitStrength-deflect-cancel": { variantCastFrames: MO_BLADE_DEFLECT_CAST },
}

const swapped = (value: unknown, pair: ValuePair | undefined): unknown =>
  pair && value === pair.from ? pair.to : value

function retimedHit(hit: unknown, retiming: Retiming, index: number): unknown {
  if (index !== 0 || !isRecord(hit)) return hit
  const retimed: RecordValue = { ...hit }
  if (retiming.hitFrame) retimed.frame = swapped(hit.frame, retiming.hitFrame)
  if (retiming.variantCastFrames && Array.isArray(hit.variants))
    retimed.variants = hit.variants.map((variant) =>
      isRecord(variant)
        ? { ...variant, castFrames: swapped(variant.castFrames, retiming.variantCastFrames) }
        : variant,
    )
  return retimed
}

function retimedGrantFrames(
  grantFrames: unknown,
  retimings: Readonly<Record<string, ValuePair>>,
): unknown {
  if (!isRecord(grantFrames)) return grantFrames
  return Object.fromEntries(
    Object.entries(grantFrames).map(([buffId, frame]) => [
      buffId,
      swapped(frame, retimings[buffId]),
    ]),
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const retiming = RETIMINGS[skill.id]
  if (!retiming) return skill
  const healed: RecordValue = {
    ...skill,
    hits: skill.hits.map((hit, index) => retimedHit(hit, retiming, index)),
  }
  if (retiming.castFrames) healed.castFrames = swapped(skill.castFrames, retiming.castFrames)
  if (retiming.grantFrames)
    healed.triggersBuffsAtFrame = retimedGrantFrames(
      skill.triggersBuffsAtFrame,
      retiming.grantFrames,
    )
  return healed
}

export const V96__stonesplitFractionalFrameTiming: CustomSkillMigration = {
  to: 96,
  name: "V96__stonesplitFractionalFrameTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 96, skills }
  },
}
