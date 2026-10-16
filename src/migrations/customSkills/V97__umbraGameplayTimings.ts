// v96 → v97 — Inner Balance Strike III, Second Track Slash, Spear light stage 2
// and Drifting Thrust take their in-game timings: the Special's hits land at
// 28.8 / 35.16 / 43.44 / 75.96 f and its 1- and 2-hit forms exist only before
// a Deflect (29.8 / 36.16 f), its 3-hit form only with Sword Horizon (63.78 f)
// and its Sword Horizon 4-hit form ends 76.96 f in; a charged partial form
// ends one frame past its last kept hit instead of waiting for a follow-up
// that lands the hits after it; light stage 2's hit lands at 14.24 f; the
// Drifting Thrust drill hits and finisher (14.97 f into the finishing clip)
// land at their in-game frames. A Skill Editor copy seeded before this still
// carries the old values. Only a value still identical to what was seeded is
// rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const pair = (from: number, to: number): ValuePair => ({ from, to })

const swapped = (value: unknown, valuePair: ValuePair | undefined): unknown =>
  valuePair && value === valuePair.from ? valuePair.to : value

const SWORD_HORIZON_CONDITION = { param: "swordHorizon" }

const SWORD_SPECIAL_HIT_FRAMES = [pair(29, 28.8), pair(35, 35.16), pair(43, 43.44), pair(76, 75.96)]

const SPEAR_HEAVY_STAGE_1_FRAMES = [
  pair(35, 34.5),
  pair(44, 43.9),
  pair(53, 53.1),
  pair(62, 62.1),
  pair(71, 71),
  pair(81, 81),
  pair(91, 90.7),
  pair(101, 101),
  pair(117, 120.57),
]

const SPEAR_HEAVY_STAGE_2_FRAMES = [
  pair(95, 94.5),
  pair(104, 103.9),
  pair(113, 113.1),
  pair(122, 122.1),
  pair(131, 131),
  pair(141, 141),
  pair(151, 150.7),
  pair(161, 161),
  pair(171, 171.1),
  pair(182, 181.5),
  pair(191, 191.2),
  pair(202, 202.4),
  pair(213, 212.5),
  pair(222, 222.1),
  pair(232, 231.5),
  pair(245, 248.97),
]

const CHARGE_FOLLOW_UP_IDS = [
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
]

const withHitFrames = (skill: RecordValue, pairs: readonly ValuePair[]): RecordValue => ({
  ...skill,
  hits: (skill.hits as unknown[]).map((hit, index) =>
    isRecord(hit) && pairs[index] ? { ...hit, frame: swapped(hit.frame, pairs[index]) } : hit,
  ),
})

const withCastFrames = (skill: RecordValue, castFrames: ValuePair): RecordValue => ({
  ...skill,
  castFrames: swapped(skill.castFrames, castFrames),
})

const isGatedOnFollowUp = (hit: unknown): boolean =>
  isRecord(hit) &&
  Array.isArray(hit.requiresNextStepSkillIds) &&
  hit.requiresNextStepSkillIds.length === CHARGE_FOLLOW_UP_IDS.length &&
  CHARGE_FOLLOW_UP_IDS.every((id) => (hit.requiresNextStepSkillIds as unknown[]).includes(id))

const withoutFollowUpGatedHits = (skill: RecordValue): RecordValue => ({
  ...skill,
  hits: (skill.hits as unknown[]).filter((hit) => !isGatedOnFollowUp(hit)),
})

const withoutSwordHorizonCastVariant = (
  skill: RecordValue,
  variantId: string,
  castFrames: number,
): RecordValue => {
  const [first, ...rest] = skill.hits as unknown[]
  if (!isRecord(first) || !Array.isArray(first.variants)) return skill
  const variants = first.variants.filter(
    (variant) =>
      !(isRecord(variant) && variant.id === variantId && variant.castFrames === castFrames),
  )
  if (variants.length === first.variants.length) return skill
  const { variants: _dropped, ...hitWithoutVariants } = first
  return {
    ...skill,
    hits: [variants.length > 0 ? { ...first, variants } : hitWithoutVariants, ...rest],
  }
}

const withVariantCastFrames = (
  skill: RecordValue,
  variantId: string,
  castFrames: ValuePair,
): RecordValue => ({
  ...skill,
  hits: (skill.hits as unknown[]).map((hit) =>
    isRecord(hit) && Array.isArray(hit.variants)
      ? {
          ...hit,
          variants: hit.variants.map((variant) =>
            isRecord(variant) && variant.id === variantId
              ? { ...variant, castFrames: swapped(variant.castFrames, castFrames) }
              : variant,
          ),
        }
      : hit,
  ),
})

const withDeflectCancel = (skill: RecordValue): RecordValue =>
  skill.cancelledBy === undefined ? { ...skill, cancelledBy: "deflectCancel" } : skill

const withSwordHorizonCastCondition = (skill: RecordValue): RecordValue => {
  const conditions = Array.isArray(skill.castConditions) ? skill.castConditions : []
  const present = conditions.some(
    (condition) => isRecord(condition) && condition.param === SWORD_HORIZON_CONDITION.param,
  )
  return present ? skill : { ...skill, castConditions: [...conditions, SWORD_HORIZON_CONDITION] }
}

const withoutSwordHorizonCastCondition = (skill: RecordValue): RecordValue => {
  if (!Array.isArray(skill.castConditions)) return skill
  const remaining = skill.castConditions.filter(
    (condition) => !(isRecord(condition) && condition.param === SWORD_HORIZON_CONDITION.param),
  )
  if (remaining.length === skill.castConditions.length) return skill
  const { castConditions: _dropped, ...rest } = skill
  return remaining.length > 0 ? { ...rest, castConditions: remaining } : rest
}

function healSwordSpecialOneOrTwoHit(skill: RecordValue, castFrames: ValuePair): RecordValue {
  const retimed = withCastFrames(withHitFrames(skill, SWORD_SPECIAL_HIT_FRAMES), castFrames)
  return retimed.castFrames === skill.castFrames ? retimed : withDeflectCancel(retimed)
}

function healChargePartialForm(skill: RecordValue, castFrames: ValuePair): RecordValue {
  return withCastFrames(withoutFollowUpGatedHits(skill), castFrames)
}

const HEALERS: Readonly<Record<string, (skill: RecordValue) => RecordValue>> = {
  "bellstrikeUmbra-swordspecial-1-hit": (skill) =>
    healSwordSpecialOneOrTwoHit(skill, pair(41, 29.8)),
  "bellstrikeUmbra-swordspecial-2-hit": (skill) =>
    healSwordSpecialOneOrTwoHit(skill, pair(47, 36.16)),
  "bellstrikeUmbra-swordspecial-3-hit": (skill) => {
    const retimed = withCastFrames(
      withoutSwordHorizonCastVariant(
        withHitFrames(skill, SWORD_SPECIAL_HIT_FRAMES),
        "hv-swordspecial-3-hit-hit-0-sword-horizon",
        64,
      ),
      pair(71, 63.78),
    )
    return retimed.castFrames === skill.castFrames
      ? retimed
      : withSwordHorizonCastCondition(retimed)
  },
  "bellstrikeUmbra-swordspecial-4-hit": (skill) =>
    withVariantCastFrames(
      withHitFrames(skill, SWORD_SPECIAL_HIT_FRAMES),
      "hv-swordspecial-4-hit-hit-0-sword-horizon",
      pair(77, 76.96),
    ),
  "bellstrikeUmbra-swordspecial-4-hit-final": (skill) => withHitFrames(skill, [pair(33, 32.52)]),
  "bellstrikeUmbra-sword-charge-stage-1-1-hit": (skill) =>
    healChargePartialForm(skill, pair(49, 37.76)),
  "bellstrikeUmbra-sword-charge-stage-1-2-hit": (skill) =>
    healChargePartialForm(skill, pair(73, 62.46)),
  "bellstrikeUmbra-sword-charge-stage-1-3-hit": (skill) =>
    healChargePartialForm(skill, pair(83, 72.25)),
  "bellstrikeUmbra-sword-charge-stage-1-4-hit": (skill) =>
    healChargePartialForm(skill, pair(87, 82.11)),
  "bellstrikeUmbra-sword-charge-stage-2-4-hit": (skill) => {
    const retimed = withCastFrames(skill, pair(142, 136.11))
    return retimed.castFrames === skill.castFrames
      ? retimed
      : withoutSwordHorizonCastCondition(retimed)
  },
  "bellstrikeUmbra-spear-light-2": (skill) => withHitFrames(skill, [pair(14, 14.24)]),
  "bellstrikeUmbra-spearheavy-stage-1": (skill) => withHitFrames(skill, SPEAR_HEAVY_STAGE_1_FRAMES),
  "bellstrikeUmbra-spearheavy": (skill) => withHitFrames(skill, SPEAR_HEAVY_STAGE_2_FRAMES),
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const healer = HEALERS[skill.id]
  return healer ? healer(skill) : skill
}

export const V97__umbraGameplayTimings: CustomSkillMigration = {
  to: 97,
  name: "V97__umbraGameplayTimings",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 97, skills }
  },
}
