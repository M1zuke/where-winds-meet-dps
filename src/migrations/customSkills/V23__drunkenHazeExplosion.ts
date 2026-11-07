// v22 → v23 — a Drunken Poet strike's Drunken Aura explodes on a target
// already burning from Combustion or Smolder: Poet2-4 gained two conditional
// hits of their own, and the final strike's own explosion moved to a
// separate cast its hit-0 now triggers. A Skill Editor copy seeded before
// that still carries the old, shorter shape. Only a copy still identical to
// what was seeded is rewritten: once it differs, a stale copy and a
// deliberate edit are indistinguishable.
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

const POET_STRIKE_ROW: CoefficientRow = {
  physMultiplier: 1.02325,
  attributeMultiplier: 1.534875,
  physFixed: 153.82,
}
const POET_STRIKE_IDS = new Set(["mystic-poet2", "mystic-poet3", "mystic-poet4"])

const COMBUSTION_EXPLOSION_HIT = {
  id: "hit-1",
  frame: 0,
  physMultiplier: 0.70166,
  attributeMultiplier: 1.05249,
  physFixed: 105.48,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [],
  conditions: [
    { buffId: "debuff-mystic-combustion", op: "gte", stacks: 1 },
    { buffId: "debuff-mystic-smolder", op: "eq", stacks: 0 },
  ],
}
const SMOLDER_EXPLOSION_HIT = {
  id: "hit-2",
  frame: 0,
  physMultiplier: 1.60796,
  attributeMultiplier: 2.41194,
  physFixed: 241.72,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [],
  conditions: [{ buffId: "debuff-mystic-smolder", op: "gte", stacks: 1 }],
}

export function addDrunkenHazeExplosionHits(id: string, hits: unknown): unknown {
  if (!POET_STRIKE_IDS.has(id) || !Array.isArray(hits)) return hits
  if (hits.length !== 1 || !coefficientsMatch(hits[0], POET_STRIKE_ROW)) return hits
  return [hits[0], COMBUSTION_EXPLOSION_HIT, SMOLDER_EXPLOSION_HIT]
}

const FINAL_STRIKE_ID = "mystic-poet-final-hit-cancel"
const FINAL_STRIKE_ROW: CoefficientRow = {
  physMultiplier: 1.70541,
  attributeMultiplier: 2.558115,
  physFixed: 256.37,
}
const COMBUSTION_EXTEND_TRIGGER = {
  kind: "applyDebuff",
  targetId: "debuff-mystic-combustion",
  stacks: 0,
  condition: null,
  extendFrames: 90,
  extendOnly: true,
}
const EXPLOSION_CAST_TRIGGER = {
  kind: "castSkill",
  targetId: "mystic-poet-final-hit-cancel-explosion",
  stacks: 1,
  condition: null,
}

function hasOnlyTheCombustionExtendTrigger(triggers: unknown): boolean {
  if (!Array.isArray(triggers) || triggers.length !== 1) return false
  const [trigger] = triggers
  return (
    isRecord(trigger) &&
    trigger.kind === COMBUSTION_EXTEND_TRIGGER.kind &&
    trigger.targetId === COMBUSTION_EXTEND_TRIGGER.targetId &&
    trigger.extendFrames === COMBUSTION_EXTEND_TRIGGER.extendFrames &&
    trigger.extendOnly === COMBUSTION_EXTEND_TRIGGER.extendOnly
  )
}

export function addFinalStrikeExplosionTrigger(id: string, hits: unknown): unknown {
  if (id !== FINAL_STRIKE_ID || !Array.isArray(hits) || hits.length !== 1) return hits
  const [hit] = hits
  if (!coefficientsMatch(hit, FINAL_STRIKE_ROW) || !isRecord(hit)) return hits
  if (!hasOnlyTheCombustionExtendTrigger(hit.triggers)) return hits
  return [{ ...hit, triggers: [...(hit.triggers as unknown[]), EXPLOSION_CAST_TRIGGER] }]
}

function migrateSkillHits(id: string, hits: unknown): unknown {
  return addFinalStrikeExplosionTrigger(id, addDrunkenHazeExplosionHits(id, hits))
}

export const V23__drunkenHazeExplosion: CustomSkillMigration = {
  to: 23,
  name: "V23__drunkenHazeExplosion",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map((skill) =>
          isRecord(skill) && typeof skill.id === "string"
            ? { ...skill, hits: migrateSkillHits(skill.id, skill.hits) }
            : skill,
        )
      : blob.skills
    return { ...blob, v: 23, skills }
  },
}
