// v86 → v87 — the Binge Points the chained drink converts are banked by the
// Primepick follow-up on frame 27 (Tipsylay banked them before), and by
// Boundvessel's finish on frame 159 instead of on its first finishing slash.
// The drinks convert on frame 19 (the plain drink on frame 1, the perfect and
// twin-blade drinks on frame 18 before). Dragonquench - Inebriate's Abrasion
// immunity is no longer an always-on skill flag: like Hero's Blood -
// Inebriate's it reads Binge Points of at least 200 at the hit through the
// renamed talent buff. A Skill Editor copy seeded before this still carries the
// old shape. Only a part still identical to what was seeded is rewritten: once
// it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

const sameValue = (left: unknown, right: unknown): boolean => canonical(left) === canonical(right)

const ACCUMULATION_ID = "buff-bamboocutDraught-skill-binge-point-accumulation"
const CAROUSE_ID = "buff-bamboocutDraught-carouse"
const SKYSPEAK_TIER_4 = { param: "skyspeak", minTier: 4 }
const IN_CAROUSE = { buffId: CAROUSE_ID, op: "gte", stacks: 1 }

const TIPSYLAY_ID = "bamboocutDraught-nightwick-primepick"
const FOLLOW_UP_IDS = [
  "bamboocutDraught-nightwick-primepick-follow-up",
  "bamboocutDraught-nightwick-primepick-follow-up-cancel",
]
const FOLLOW_UP_THRUST_FRAME = 20
const FOLLOW_UP_BANKING_FRAME = 27

const DRINK_FRAME_REWRITES: Readonly<Record<string, readonly [from: number, to: number]>> = {
  "bamboocutDraught-whaledraft": [1, 19],
  "bamboocutDraught-quick-drink": [18, 19],
  "bamboocutDraught-quick-drink-cancel": [18, 19],
  "bamboocutDraught-twinblade-quick-drink": [18, 19],
  "bamboocutDraught-twinblade-quick-drink-cancel": [18, 19],
}

const BOUNDVESSEL_IDS = [
  "bamboocutDraught-boundvessel",
  "bamboocutDraught-boundvessel-drink-cancel",
]
const FINISHING_SLASH_ID = "hit-12"
const FINISHING_SLASH_FRAME = 144
const BOUNDVESSEL_BANKING_FRAME = 159

const DRAGONQUENCH_IDS = [
  "bamboocutDraught-dragonquench-inebriate",
  "bamboocutDraught-dragonquench-inebriate-cancel",
  "bamboocutDraught-dragonquench-inebriate-second",
  "bamboocutDraught-dragonquench-inebriate-second-cancel",
  "bamboocutDraught-dragonquench-inebriate-third",
  "bamboocutDraught-dragonquench-inebriate-third-cancel",
]
const DRAGONQUENCH_RECEIVES_BEFORE = [
  "eonpourInebriateDamage",
  "inebriateSkillCritDamage",
  "drunkslayEcho",
  "volutefitWineboundDamage",
  "tiltrimInebriateBonus",
  "skystrikeGauntletsAdditionalAttack",
  "nonPlayerBaseDamage40",
]
const OLD_NO_ABRASION_ID = "herosBloodInebriateNoAbrasion"
const NO_ABRASION_ID = "bingePointGainNoAbrasion"

const accumulationTriggers = (extraConditions: readonly RecordValue[]): RecordValue[] => [
  {
    kind: "applyBuff",
    targetId: ACCUMULATION_ID,
    stacks: 25,
    condition: null,
    ...(extraConditions.length > 0 ? { conditions: [...extraConditions] } : {}),
  },
  {
    kind: "applyBuff",
    targetId: ACCUMULATION_ID,
    stacks: 25,
    condition: null,
    conditions: [...extraConditions, IN_CAROUSE],
  },
]

const bankingHit = (
  id: string,
  frame: number,
  triggers: RecordValue[],
  conditions: readonly unknown[],
): RecordValue => ({
  id,
  frame,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers,
  ...(conditions.length > 0 ? { conditions: [...conditions] } : {}),
})

const freshHitId = (hits: readonly unknown[], preferred: string): string => {
  const taken = new Set(hits.map((hit) => (isRecord(hit) ? hit.id : undefined)))
  let candidate = preferred
  for (let suffix = 2; taken.has(candidate); suffix++) candidate = `${preferred}-${suffix}`
  return candidate
}

function healTipsylay(skill: RecordValue, hits: unknown[]): RecordValue {
  const [thrust] = hits
  if (
    hits.length !== 1 ||
    !isRecord(thrust) ||
    !sameValue(thrust.triggers, accumulationTriggers([]))
  )
    return skill
  return { ...skill, hits: [{ ...thrust, triggers: [] }] }
}

const isSeededThrust = (hit: unknown): hit is RecordValue =>
  isRecord(hit) &&
  hit.frame === FOLLOW_UP_THRUST_FRAME &&
  hit.physMultiplier === 0.64565 &&
  hit.physFixed === 180

function healFollowUp(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 1 || !isSeededThrust(hits[0])) return skill
  return {
    ...skill,
    hits: [
      hits[0],
      bankingHit(freshHitId(hits, "hit-1"), FOLLOW_UP_BANKING_FRAME, accumulationTriggers([]), []),
    ],
  }
}

function healDrinkFrame(
  skill: RecordValue,
  hits: unknown[],
  [from, to]: readonly [number, number],
): RecordValue {
  if (hits.length !== 1 || !isRecord(hits[0]) || hits[0].frame !== from) return skill
  return { ...skill, hits: [{ ...hits[0], frame: to }] }
}

function healBoundvessel(skill: RecordValue, hits: unknown[]): RecordValue {
  const finishingSlash = hits.find((hit) => isRecord(hit) && hit.id === FINISHING_SLASH_ID)
  if (
    !isRecord(finishingSlash) ||
    finishingSlash.frame !== FINISHING_SLASH_FRAME ||
    !sameValue(finishingSlash.triggers, accumulationTriggers([SKYSPEAK_TIER_4]))
  )
    return skill
  const conditions = Array.isArray(finishingSlash.conditions) ? finishingSlash.conditions : []
  const banking = bankingHit(
    freshHitId(hits, "hit-15"),
    BOUNDVESSEL_BANKING_FRAME,
    accumulationTriggers([SKYSPEAK_TIER_4]),
    conditions,
  )
  return {
    ...skill,
    hits: hits.flatMap((hit) =>
      hit === finishingSlash ? [{ ...finishingSlash, triggers: [] }, banking] : [hit],
    ),
  }
}

function healDragonquench(skill: RecordValue): RecordValue {
  if (skill.neverAbrades !== true || !sameValue(skill.receives, DRAGONQUENCH_RECEIVES_BEFORE))
    return skill
  const healed: RecordValue = {
    ...skill,
    receives: [...DRAGONQUENCH_RECEIVES_BEFORE, NO_ABRASION_ID],
  }
  delete healed.neverAbrades
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const renamed = Array.isArray(skill.receives) && skill.receives.includes(OLD_NO_ABRASION_ID)
  const base: RecordValue = renamed
    ? {
        ...skill,
        receives: (skill.receives as unknown[]).map((id) =>
          id === OLD_NO_ABRASION_ID ? NO_ABRASION_ID : id,
        ),
      }
    : skill
  const hits = Array.isArray(base.hits) ? (base.hits as unknown[]) : []
  if (base.id === TIPSYLAY_ID) return healTipsylay(base, hits)
  if (FOLLOW_UP_IDS.includes(base.id as string)) return healFollowUp(base, hits)
  const drinkFrames = DRINK_FRAME_REWRITES[base.id as string]
  if (drinkFrames) return healDrinkFrame(base, hits, drinkFrames)
  if (BOUNDVESSEL_IDS.includes(base.id as string)) return healBoundvessel(base, hits)
  if (DRAGONQUENCH_IDS.includes(base.id as string)) return healDragonquench(base)
  return base
}

export const V87__draughtGrantTimingAndAbrasionTalent: CustomSkillMigration = {
  to: 87,
  name: "V87__draughtGrantTimingAndAbrasionTalent",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 87, skills }
  },
}
