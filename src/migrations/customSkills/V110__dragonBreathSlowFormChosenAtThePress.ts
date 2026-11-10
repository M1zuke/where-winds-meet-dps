// v109 → v110 — Dragon's Breath without Intoxicated at the press plays its slow
// animation for the whole cast and opens Intoxicated 12 frames in. v108 put the
// choice on the first hit alone and opened Intoxicated from that hit; its
// seeded copies carry the "Not Intoxicated" variant on hit 0 only, an
// Intoxicated trigger on hit 0, a slow cast of 150 frames (full forms) or
// 80.38 (single-hit forms) and, on the single-hit forms, a quick cast of 40.
// Now the full forms' hits 1 and 2 carry the slow frames too and the slow cast
// ends one frame past hit 2, a zero-damage hit at frame 12 opens Intoxicated,
// and the single-hit forms land their later hits unless a higher-priority step
// follows. Only values still identical to what was seeded are rewritten: once
// one differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const INTOXICATED_ID = "debuff-mystic-intoxicated"
const NOT_INTOXICATED = { buffId: INTOXICATED_ID, op: "lt", stacks: 1 }
const INTOXICATED = { buffId: INTOXICATED_ID, op: "gte", stacks: 1 }
const HIGHER_PRIORITY_NEXT_STEPS = ["universal-deflect-cancel", "bellstrikeSplendor-energysurge"]

const OPENER_FRAME = 12
const SLOW_SECOND_HIT_FRAME = 163.66
const SLOW_BONUS_FRAME = 169.66
const SLOW_FULL_CAST_FRAMES = 164.66
const SLOW_BREAK_FRAME = 150
const SLOW_HIGHER_PRIORITY_BREAK_FRAME = 77.38
const QUICK_BREAK_FRAME = 136.8
const QUICK_HIGHER_PRIORITY_BREAK_FRAME = 37.39
const SEEDED_SINGLE_QUICK_CAST_FRAMES = 40
const SEEDED_SINGLE_SLOW_CAST_FRAMES = 80.38
const SEEDED_FULL_SLOW_CAST_FRAMES = 150

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}

const SMOLDER_TRIGGER = {
  kind: "applyDebuff",
  targetId: "debuff-mystic-smolder",
  stacks: 1,
  condition: null,
  extendFrames: 240,
}
const COMBUSTION_TRIGGER = {
  kind: "applyDebuff",
  targetId: "debuff-mystic-combustion",
  stacks: 1,
  condition: null,
  extendFrames: 90,
  extendOnly: true,
}

const FULL_FORM_IDS = ["mystic-fire-breath-2-hit", "mystic-dragon-fire-smolder-2-hits"]

const SINGLE_FORMS: Record<
  string,
  { second: CoefficientRow; bonus: CoefficientRow; trigger: RecordValue }
> = {
  "mystic-fire-breath-1-hit": {
    second: {
      physMultiplier: 1.360884,
      attributeMultiplier: 2.041327,
      physFixed: 215.2962,
      attributeFixed: 0,
    },
    bonus: {
      physMultiplier: 1.49975,
      attributeMultiplier: 2.249625,
      physFixed: 237.2652,
      attributeFixed: 0,
    },
    trigger: COMBUSTION_TRIGGER,
  },
  "mystic-dragon-fire-smolder-1-hit": {
    second: {
      physMultiplier: 1.283899,
      attributeMultiplier: 1.925849,
      physFixed: 204.9587,
      attributeFixed: 0,
    },
    bonus: {
      physMultiplier: 1.41491,
      attributeMultiplier: 2.122364,
      physFixed: 225.8728,
      attributeFixed: 0,
    },
    trigger: SMOLDER_TRIGGER,
  },
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const rowOf = (source: RecordValue): CoefficientRow => ({
  physMultiplier: source.physMultiplier as number,
  attributeMultiplier: source.attributeMultiplier as number,
  physFixed: source.physFixed as number,
  attributeFixed: source.attributeFixed as number,
})

const isIntoxicatedTrigger = (trigger: unknown) =>
  isRecord(trigger) && trigger.targetId === INTOXICATED_ID

const hasOpener = (hits: unknown[]) =>
  hits.some(
    (candidate) =>
      isRecord(candidate) &&
      candidate.frame === OPENER_FRAME &&
      Array.isArray(candidate.triggers) &&
      candidate.triggers.some(isIntoxicatedTrigger),
  )

const slowVariantIdOf = (skillId: string, hitIndex: number) =>
  `hv-${skillId}-hit-${hitIndex}-slow-form`

const slowVariantOf = (hit: RecordValue, skillId: string, hitIndex: number): RecordValue | null => {
  const variants = Array.isArray(hit.variants) ? hit.variants : []
  const found = variants.find(
    (variant) => isRecord(variant) && variant.id === slowVariantIdOf(skillId, hitIndex),
  )
  return isRecord(found) ? found : null
}

const withoutIntoxicatedTriggers = (hit: RecordValue): RecordValue => ({
  ...hit,
  triggers: (Array.isArray(hit.triggers) ? hit.triggers : []).filter(
    (trigger) => !isIntoxicatedTrigger(trigger),
  ),
})

const freeHitId = (hits: unknown[], position: number): string => {
  const taken = new Set(hits.map((candidate) => (isRecord(candidate) ? candidate.id : undefined)))
  let next = position
  while (taken.has(`hit-${next}`)) next++
  return `hit-${next}`
}

const zeroDamageHit = (id: string, extra: RecordValue): RecordValue => ({
  id,
  frame: OPENER_FRAME,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  extraCritDamage: 0,
  conditions: [NOT_INTOXICATED],
  triggers: [{ kind: "applyDebuff", targetId: INTOXICATED_ID, stacks: 1, condition: null }],
  ...extra,
})

function healFullForm(skillId: string, skill: RecordValue, hits: unknown[]): RecordValue {
  const [firstHit, secondHit, bonusHit] = hits
  if (!isRecord(firstHit) || !isRecord(secondHit) || !isRecord(bonusHit)) return skill
  const firstVariant = slowVariantOf(firstHit, skillId, 0)
  if (!firstVariant) return skill
  const variantOnFirst = (firstHit.variants as RecordValue[]).map((variant) =>
    variant === firstVariant && variant.castFrames === SEEDED_FULL_SLOW_CAST_FRAMES
      ? { ...variant, castFrames: SLOW_FULL_CAST_FRAMES }
      : variant,
  )
  const withSlowFrame = (hit: RecordValue, hitIndex: number, frame: number): RecordValue =>
    slowVariantOf(hit, skillId, hitIndex)
      ? hit
      : {
          ...hit,
          variants: [
            ...(Array.isArray(hit.variants) ? hit.variants : []),
            {
              id: slowVariantIdOf(skillId, hitIndex),
              label: "Not Intoxicated",
              conditions: [NOT_INTOXICATED],
              ...rowOf(hit),
              frame,
            },
          ],
        }
  const healedHits = [
    { ...withoutIntoxicatedTriggers(firstHit), variants: variantOnFirst },
    secondHit.frame === 102 ? withSlowFrame(secondHit, 1, SLOW_SECOND_HIT_FRAME) : secondHit,
    bonusHit.frame === 108 ? withSlowFrame(bonusHit, 2, SLOW_BONUS_FRAME) : bonusHit,
    ...hits.slice(3),
  ]
  if (!hasOpener(healedHits))
    healedHits.push(zeroDamageHit(freeHitId(healedHits, healedHits.length), {}))
  return { ...skill, hits: healedHits }
}

function healSingleForm(skillId: string, skill: RecordValue, hits: unknown[]): RecordValue {
  const [firstHit] = hits
  const form = SINGLE_FORMS[skillId]
  if (!isRecord(firstHit) || !form || hits.length !== 1) return skill
  const firstVariant = slowVariantOf(firstHit, skillId, 0)
  if (!firstVariant) return skill
  const variants = (firstHit.variants as RecordValue[]).map((variant) => {
    if (variant !== firstVariant || variant.castFrames !== SEEDED_SINGLE_SLOW_CAST_FRAMES)
      return variant
    return Object.fromEntries(Object.entries(variant).filter(([key]) => key !== "castFrames"))
  })
  const quickFollowUp = (id: string, frame: number, row: CoefficientRow): RecordValue => ({
    id,
    frame,
    ...row,
    extraCritDamage: 0,
    conditions: [INTOXICATED],
    unlessNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
    castFramesWhenGated: QUICK_BREAK_FRAME,
    triggers: [form.trigger],
  })
  const slowBreak = zeroDamageHit("hit-3", {
    unlessNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
    castFramesWhenGated: SLOW_BREAK_FRAME,
  })
  const slowHigherPriorityBreak = zeroDamageHit("hit-4", {
    requiresNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
    castFramesWhenGated: SLOW_HIGHER_PRIORITY_BREAK_FRAME,
  })
  return {
    ...skill,
    castFrames:
      skill.castFrames === SEEDED_SINGLE_QUICK_CAST_FRAMES
        ? QUICK_HIGHER_PRIORITY_BREAK_FRAME
        : skill.castFrames,
    hits: [
      { ...withoutIntoxicatedTriggers(firstHit), variants },
      quickFollowUp("hit-1", 102, form.second),
      quickFollowUp("hit-2", 108, form.bonus),
      slowBreak,
      slowHigherPriorityBreak,
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  if (FULL_FORM_IDS.includes(skill.id)) return healFullForm(skill.id, skill, skill.hits)
  if (skill.id in SINGLE_FORMS) return healSingleForm(skill.id, skill, skill.hits)
  return skill
}

export const V110__dragonBreathSlowFormChosenAtThePress: CustomSkillMigration = {
  to: 110,
  name: "V110__dragonBreathSlowFormChosenAtThePress",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 110, skills }
  },
}
