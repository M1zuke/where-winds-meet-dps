// v90 → v91 — Tipsylay opens the Nightwick follow-up stance on frame 4, which
// Primepick (both forms) and Grounddrift need and spend; Blade Vessel and the
// twin-blade light attack's first stage are flagged while Empowered Light
// Attack turns them into Tidepour and Blade Against Waves. A Skill Editor copy
// seeded before this lacks the gates and the granting and spending hits. Only a
// copy still shaped as seeded is extended: once it differs, a stale copy and a
// deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isEmpty = (value: unknown): boolean =>
  value === undefined || (Array.isArray(value) && value.length === 0)

const BINGE_POINTS_ID = "buff-bamboocutDraught-binge-points"
const EMPOWERED_ID = "buff-bamboocutDraught-empowered-light-attack"
const STANCE_ID = "buff-bamboocutDraught-nightwick-stance"

const TIPSYLAY_ID = "bamboocutDraught-nightwick-primepick"
const FOLLOW_UP_IDS = [
  "bamboocutDraught-nightwick-primepick-follow-up",
  "bamboocutDraught-nightwick-primepick-follow-up-cancel",
]
const GROUNDDRIFT_ID = "bamboocutDraught-nightwick-grounddrift"
const BLADE_VESSEL_ID = "bamboocutDraught-blade-vessel"
const LIGHT_ATTACK_ID = "bamboocutDraught-dual-blades-light-attack-1"

const lightAttackNotReplaced = {
  anyOf: [
    { buffId: EMPOWERED_ID, op: "eq", stacks: 0 },
    { buffId: BINGE_POINTS_ID, op: "lte", stacks: 49 },
  ],
}
const bladeVesselNotReplaced = [
  {
    anyOf: [
      { buffId: BINGE_POINTS_ID, op: "lt", stacks: 100 },
      { buffId: EMPOWERED_ID, op: "gte", stacks: 1 },
    ],
  },
  lightAttackNotReplaced,
]

const stanceHit = (
  hits: readonly unknown[],
  preferredId: string,
  frame: number,
  stacks: number,
) => {
  const taken = new Set(hits.map((hit) => (isRecord(hit) ? hit.id : undefined)))
  let id = preferredId
  for (let suffix = 2; taken.has(id); suffix++) id = `${preferredId}-${suffix}`
  return {
    id,
    frame,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [{ kind: "applyBuff", targetId: STANCE_ID, stacks, condition: null }],
  }
}

const stanceHeld = [{ buffId: STANCE_ID, op: "gte", stacks: 1 }]

function healTipsylay(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 2) return skill
  return { ...skill, hits: [...hits, stanceHit(hits, "hit-2", 4, 1)] }
}

function healStanceConsumer(
  skill: RecordValue,
  hits: unknown[],
  seededHitCount: number,
): RecordValue {
  if (hits.length !== seededHitCount || !isEmpty(skill.castConditions)) return skill
  return {
    ...skill,
    castConditions: stanceHeld,
    hits: [...hits, stanceHit(hits, `hit-${seededHitCount}`, 0, -1)],
  }
}

function withGate(skill: RecordValue, castConditions: unknown[]): RecordValue {
  return isEmpty(skill.castConditions) ? { ...skill, castConditions } : skill
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits as unknown[]
  if (skill.id === TIPSYLAY_ID) return healTipsylay(skill, hits)
  if (FOLLOW_UP_IDS.includes(skill.id)) return healStanceConsumer(skill, hits, 2)
  if (skill.id === GROUNDDRIFT_ID) return healStanceConsumer(skill, hits, 5)
  if (skill.id === BLADE_VESSEL_ID) return withGate(skill, bladeVesselNotReplaced)
  if (skill.id === LIGHT_ATTACK_ID) return withGate(skill, [lightAttackNotReplaced])
  return skill
}

export const V91__draughtNightwickStanceAndVariedComboOverrides: CustomSkillMigration = {
  to: 91,
  name: "V91__draughtNightwickStanceAndVariedComboOverrides",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 91, skills }
  },
}
