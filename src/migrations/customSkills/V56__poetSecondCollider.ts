// v55 → v56 — every Drunken Poet strike's clip fires two colliders, not one:
// Poet1 gained a mirrored second strike hit, and Poet2-4 gained a mirrored
// second strike plus a second pair of explosion-condition hits. A Skill
// Editor copy seeded before this still carries the old, single-collider
// shape. Only a copy still identical to what was seeded is rewritten: once
// it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function coefficientsMatch(hit: unknown, row: CoefficientRow): boolean {
  return (
    isRecord(hit) &&
    hit.physMultiplier === row.physMultiplier &&
    hit.attributeMultiplier === row.attributeMultiplier &&
    hit.physFixed === row.physFixed
  )
}

const STRIKE_ROW: CoefficientRow = {
  physMultiplier: 1.02325,
  attributeMultiplier: 1.534875,
  physFixed: 153.82,
}
const COMBUSTION_ROW: CoefficientRow = {
  physMultiplier: 0.70166,
  attributeMultiplier: 1.05249,
  physFixed: 105.48,
}
const SMOLDER_ROW: CoefficientRow = {
  physMultiplier: 1.60796,
  attributeMultiplier: 2.41194,
  physFixed: 241.72,
}

function strikeHit() {
  return {
    frame: 0,
    physMultiplier: STRIKE_ROW.physMultiplier,
    attributeMultiplier: STRIKE_ROW.attributeMultiplier,
    physFixed: STRIKE_ROW.physFixed,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [],
  }
}

const COMBUSTION_CONDITIONS = [
  { buffId: "debuff-mystic-combustion", op: "gte", stacks: 1 },
  { buffId: "debuff-mystic-smolder", op: "eq", stacks: 0 },
]
const SMOLDER_CONDITIONS = [{ buffId: "debuff-mystic-smolder", op: "gte", stacks: 1 }]

function explosionHit(row: CoefficientRow, conditions: unknown[]) {
  return {
    frame: 0,
    physMultiplier: row.physMultiplier,
    attributeMultiplier: row.attributeMultiplier,
    physFixed: row.physFixed,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [],
    conditions,
  }
}

// Every output hit's `id` is its own array position — the convention every
// built-in module follows — regardless of what a stale copy's own hit ids
// happened to read; nothing keys off a hit's id across a migration.
function withPositionalIds(hits: Record<string, unknown>[]): Record<string, unknown>[] {
  return hits.map((hit, index) => ({ ...hit, id: `hit-${index}` }))
}

const POET1_SUFFIX = "-poet1"
const POET_MIDDLE_SUFFIXES = ["-poet2", "-poet3", "-poet4"]

function healPoet1(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 1) return hits
  if (!coefficientsMatch(hits[0], STRIKE_ROW)) return hits
  return withPositionalIds([hits[0], strikeHit()])
}

function healPoetMiddleStrike(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 3) return hits
  if (
    !coefficientsMatch(hits[0], STRIKE_ROW) ||
    !coefficientsMatch(hits[1], COMBUSTION_ROW) ||
    !coefficientsMatch(hits[2], SMOLDER_ROW)
  )
    return hits
  return withPositionalIds([
    hits[0],
    strikeHit(),
    explosionHit(COMBUSTION_ROW, COMBUSTION_CONDITIONS),
    explosionHit(SMOLDER_ROW, SMOLDER_CONDITIONS),
    explosionHit(COMBUSTION_ROW, COMBUSTION_CONDITIONS),
    explosionHit(SMOLDER_ROW, SMOLDER_CONDITIONS),
  ])
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const id = skill.id
  if (id.endsWith(POET1_SUFFIX)) return { ...skill, hits: healPoet1(skill.hits) }
  if (POET_MIDDLE_SUFFIXES.some((suffix) => id.endsWith(suffix)))
    return { ...skill, hits: healPoetMiddleStrike(skill.hits) }
  return skill
}

export const V56__poetSecondCollider: CustomSkillMigration = {
  to: 56,
  name: "V56__poetSecondCollider",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 56, skills }
  },
}
