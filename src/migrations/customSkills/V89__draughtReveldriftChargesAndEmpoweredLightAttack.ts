// v88 → v89 — Reveldrift spends one of two charges that recharge in 15 s each
// and keeps 3 s between casts, and Realmplay grants Empowered Light Attack for
// 1.1 s, which Blade Against Waves and Tidepour need and spend and which shuts
// Boundvessel. A Skill Editor copy seeded before this lacks the gates, the cost
// and the granting and spending hits. Only a copy still shaped as seeded is
// extended: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
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

const isEmpty = (value: unknown): boolean =>
  value === undefined || (Array.isArray(value) && value.length === 0)

const BINGE_POINTS_ID = "buff-bamboocutDraught-binge-points"
const SPACING_ID = "buff-bamboocutDraught-reveldrift-spacing"
const EMPOWERED_ID = "buff-bamboocutDraught-empowered-light-attack"
const CHARGES_METER_ID = "reveldriftCharges"
const UNITS_PER_CHARGE = 900

const BINGE_ABOVE_HALF = { buffId: BINGE_POINTS_ID, op: "gt", stacks: 49 }
const BINGE_TIPSY = { buffId: BINGE_POINTS_ID, op: "gte", stacks: 100 }
const EMPOWERED_HELD = { buffId: EMPOWERED_ID, op: "gte", stacks: 1 }
const EMPOWERED_ABSENT = { buffId: EMPOWERED_ID, op: "eq", stacks: 0 }

const gatingHit = (hits: readonly unknown[], preferredId: string, trigger: RecordValue) => {
  const taken = new Set(hits.map((hit) => (isRecord(hit) ? hit.id : undefined)))
  let id = preferredId
  for (let suffix = 2; taken.has(id); suffix++) id = `${preferredId}-${suffix}`
  return {
    id,
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [trigger],
  }
}

const applying = (targetId: string, stacks: number): RecordValue => ({
  kind: "applyBuff",
  targetId,
  stacks,
  condition: null,
})

function healReveldrift(skill: RecordValue, hits: unknown[], seededHitCount: number): RecordValue {
  if (
    hits.length !== seededHitCount ||
    !isEmpty(skill.castConditions) ||
    !isEmpty(skill.meterCosts)
  )
    return skill
  return {
    ...skill,
    castConditions: [
      { buffId: `meter:${CHARGES_METER_ID}`, op: "gte", stacks: UNITS_PER_CHARGE },
      { buffId: SPACING_ID, op: "eq", stacks: 0 },
    ],
    meterCosts: [{ meterId: CHARGES_METER_ID, amount: UNITS_PER_CHARGE }],
    hits: [...hits, gatingHit(hits, "hit-2", applying(SPACING_ID, 1))],
  }
}

function healRealmplay(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 2) return skill
  return { ...skill, hits: [...hits, gatingHit(hits, "hit-2", applying(EMPOWERED_ID, 1))] }
}

function healEmpoweredConsumer(
  skill: RecordValue,
  hits: unknown[],
  seededHitCount: number,
): RecordValue {
  if (hits.length !== seededHitCount || !sameValue(skill.castConditions, [BINGE_ABOVE_HALF]))
    return skill
  return {
    ...skill,
    castConditions: [BINGE_ABOVE_HALF, EMPOWERED_HELD],
    hits: [...hits, gatingHit(hits, `hit-${seededHitCount}`, applying(EMPOWERED_ID, -1))],
  }
}

function healBoundvessel(skill: RecordValue): RecordValue {
  if (!isEmpty(skill.castConditions)) return skill
  return { ...skill, castConditions: [BINGE_TIPSY, EMPOWERED_ABSENT] }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits as unknown[]
  switch (skill.id) {
    case "bamboocutDraught-reveldrift":
      return healReveldrift(skill, hits, 2)
    case "bamboocutDraught-reveldrift-cancel":
      return healReveldrift(skill, hits, 1)
    case "bamboocutDraught-realmplay":
      return healRealmplay(skill, hits)
    case "bamboocutDraught-blade-against-waves":
      return healEmpoweredConsumer(skill, hits, 3)
    case "bamboocutDraught-tidepour":
      return healEmpoweredConsumer(skill, hits, 2)
    case "bamboocutDraught-boundvessel":
    case "bamboocutDraught-boundvessel-drink-cancel":
      return healBoundvessel(skill)
    default:
      return skill
  }
}

export const V89__draughtReveldriftChargesAndEmpoweredLightAttack: CustomSkillMigration = {
  to: 89,
  name: "V89__draughtReveldriftChargesAndEmpoweredLightAttack",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 89, skills }
  },
}
