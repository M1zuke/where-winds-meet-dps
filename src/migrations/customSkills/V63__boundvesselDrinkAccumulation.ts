// v62 → v63 — with Skyspeak tier 4, Boundvessel's first finishing slash now
// banks Binge Points for the drink that follows (25, 50 in Carouse). A Skill
// Editor copy seeded before this still carries that slash with no triggers.
// Only a slash still identical to what was seeded is given them: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import { matchesRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const BOUNDVESSEL_ID = "bamboocutDraught-boundvessel"
const FINISHING_SLASH_ID = "hit-12"
const FINISHING_SLASH_FRAME = 144
const FINISHING_SLASH_ROW: HitRow = [0.11544, 0.17316, 32.2, 17.4]

const ACCUMULATION_ID = "buff-bamboocutDraught-skill-binge-point-accumulation"
const SKYSPEAK_TIER_4 = { param: "skyspeak", minTier: 4 }
const IN_CAROUSE = { buffId: "buff-bamboocutDraught-carouse", op: "gte", stacks: 1 }

const accumulationTriggers = () => [
  {
    kind: "applyBuff",
    targetId: ACCUMULATION_ID,
    stacks: 25,
    condition: null,
    conditions: [{ ...SKYSPEAK_TIER_4 }],
  },
  {
    kind: "applyBuff",
    targetId: ACCUMULATION_ID,
    stacks: 25,
    condition: null,
    conditions: [{ ...SKYSPEAK_TIER_4 }, { ...IN_CAROUSE }],
  },
]

const hasNoTriggers = (hit: RecordValue): boolean =>
  hit.triggers === undefined || (Array.isArray(hit.triggers) && hit.triggers.length === 0)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== BOUNDVESSEL_ID || !Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hit) =>
    isRecord(hit) &&
    hit.id === FINISHING_SLASH_ID &&
    hit.frame === FINISHING_SLASH_FRAME &&
    matchesRow(hit, FINISHING_SLASH_ROW) &&
    hasNoTriggers(hit)
      ? { ...hit, triggers: accumulationTriggers() }
      : hit,
  )
  return { ...skill, hits }
}

export const V63__boundvesselDrinkAccumulation: CustomSkillMigration = {
  to: 63,
  name: "V63__boundvesselDrinkAccumulation",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 63, skills }
  },
}
