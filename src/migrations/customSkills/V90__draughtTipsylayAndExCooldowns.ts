// v89 → v90 — Tipsylay holds a 15 s cooldown and flags a cast below 100 Binge
// Points, and the Skystrike Gauntlets ultimate holds its 60 s cooldown. A Skill
// Editor copy seeded before this lacks the gates and the cooldown grants. Only
// a copy still shaped as seeded is extended: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isEmpty = (value: unknown): boolean =>
  value === undefined || (Array.isArray(value) && value.length === 0)

const BINGE_POINTS_ID = "buff-bamboocutDraught-binge-points"
const TIPSYLAY_ID = "bamboocutDraught-nightwick-primepick"
const TIPSYLAY_COOLDOWN_ID = "buff-bamboocutDraught-tipsylay-cooldown"
const EX_ID = "bamboocutDraught-skystrike-gauntlets-ex"
const EX_COOLDOWN_ID = "buff-bamboocutDraught-skystrike-gauntlets-ex-cooldown"

const applyingCooldown = (targetId: string): RecordValue => ({
  kind: "applyBuff",
  targetId,
  stacks: 1,
  condition: null,
})

const cooldownClear = (buffId: string) => ({ buffId, op: "eq", stacks: 0 })

function healTipsylay(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 1 || !isEmpty(skill.castConditions)) return skill
  const taken = new Set(hits.map((hit) => (isRecord(hit) ? hit.id : undefined)))
  const id = taken.has("hit-1") ? "hit-1-2" : "hit-1"
  return {
    ...skill,
    castConditions: [
      { buffId: BINGE_POINTS_ID, op: "gte", stacks: 100 },
      cooldownClear(TIPSYLAY_COOLDOWN_ID),
    ],
    hits: [
      ...hits,
      {
        id,
        frame: 0,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [applyingCooldown(TIPSYLAY_COOLDOWN_ID)],
      },
    ],
  }
}

function healEx(skill: RecordValue, hits: unknown[]): RecordValue {
  const [grantingHit] = hits
  if (
    hits.length !== 1 ||
    !isEmpty(skill.castConditions) ||
    !isRecord(grantingHit) ||
    grantingHit.frame !== 0 ||
    !Array.isArray(grantingHit.triggers)
  )
    return skill
  return {
    ...skill,
    castConditions: [cooldownClear(EX_COOLDOWN_ID)],
    hits: [
      { ...grantingHit, triggers: [...grantingHit.triggers, applyingCooldown(EX_COOLDOWN_ID)] },
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits as unknown[]
  if (skill.id === TIPSYLAY_ID) return healTipsylay(skill, hits)
  if (skill.id === EX_ID) return healEx(skill, hits)
  return skill
}

export const V90__draughtTipsylayAndExCooldowns: CustomSkillMigration = {
  to: 90,
  name: "V90__draughtTipsylayAndExCooldowns",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 90, skills }
  },
}
