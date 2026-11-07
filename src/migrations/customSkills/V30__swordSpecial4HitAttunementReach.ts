// v29 → v30 — SwordSpecial 4-Hit's own 4th hit carries no attunement of its
// own anymore: it moved to a companion skill so the Special attunement,
// authored on the parent's `tags`, reaches hits 1–3 only. A Skill Editor copy
// seeded before that still lands all four hits on the one skill.
//
// Coefficients ARE editable in the Skill Editor, so only a hit whose row
// still matches what was seeded is treated as untouched; once a value
// differs, a stale copy and a deliberate edit are indistinguishable and the
// skill is left alone.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SWORDSPECIAL_4_HIT_ID = "bellstrikeUmbra-swordspecial-4-hit"

interface CoefficientRow {
  frame: number
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
  extraCritDamage: number
}

const LOW = {
  physMultiplier: 0.196354,
  attributeMultiplier: 0.294531,
  physFixed: 54.4,
  attributeFixed: 29.6,
}
const HIGH = {
  physMultiplier: 0.392708,
  attributeMultiplier: 0.589062,
  physFixed: 108.8,
  attributeFixed: 59.2,
}
const ORIGINAL_ROWS: readonly CoefficientRow[] = [
  { frame: 29, ...LOW, extraCritDamage: 0 },
  { frame: 35, ...HIGH, extraCritDamage: 0 },
  { frame: 43, ...LOW, extraCritDamage: 0 },
  { frame: 76, ...HIGH, extraCritDamage: 0 },
]

function coefficientsMatch(hit: unknown, row: CoefficientRow): boolean {
  return (
    isRecord(hit) &&
    hit.frame === row.frame &&
    hit.physMultiplier === row.physMultiplier &&
    hit.attributeMultiplier === row.attributeMultiplier &&
    hit.physFixed === row.physFixed &&
    hit.attributeFixed === row.attributeFixed &&
    hit.extraCritDamage === row.extraCritDamage
  )
}

function hasCastSkillToCompanion(triggers: unknown): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "castSkill" &&
        trigger.targetId === "bellstrikeUmbra-swordspecial-4-hit-final",
    )
  )
}

export function healSwordspecial4HitAttunementReach(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 4) return hits
  if (!hits.every((hit, index) => coefficientsMatch(hit, ORIGINAL_ROWS[index]!))) return hits
  const [hit0, hit1, hit2] = hits as Record<string, unknown>[]
  if (hasCastSkillToCompanion(hit2!.triggers)) return hits
  return [
    hit0,
    hit1,
    {
      ...hit2,
      triggers: [
        ...(hit2!.triggers as unknown[]),
        {
          kind: "castSkill",
          targetId: "bellstrikeUmbra-swordspecial-4-hit-final",
          stacks: 1,
          condition: null,
        },
      ],
    },
  ]
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== SWORDSPECIAL_4_HIT_ID || !Array.isArray(skill.hits))
    return skill
  const healed = healSwordspecial4HitAttunementReach(skill.hits)
  return healed === skill.hits ? skill : { ...skill, hits: healed }
}

export const V30__swordSpecial4HitAttunementReach: CustomSkillMigration = {
  to: 30,
  name: "V30__swordSpecial4HitAttunementReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 30, skills }
  },
}
