// v46 → v47 — the drawn-weapon ledger state now gates two rows that were
// previously always-on. A Skill Editor copy seeded before this still carries
// the old, ungated shape.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const rowMatches = (
  hit: Record<string, unknown>,
  row: readonly [number, number, number, number],
): boolean =>
  hit.physMultiplier === row[0] &&
  hit.attributeMultiplier === row[1] &&
  hit.physFixed === row[2] &&
  hit.attributeFixed === row[3]

const DRAWN_VARIANT_BY_SKILL_ID: Record<
  string,
  {
    id: string
    label: string
    conditions: { buffId: string; op: string; stacks: number }[]
    physMultiplier: number
    attributeMultiplier: number
    physFixed: number
    attributeFixed: number
    castFrames: number
  }
> = {
  "stonesplitStrength-deflect": {
    id: "hv-deflect-hit-0-mo-blade-drawn",
    label: "Mo Blade Drawn",
    conditions: [{ buffId: "drawn:Mo Blade", op: "gte", stacks: 1 }],
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    castFrames: 18,
  },
  "stonesplitStrength-deflect-cancel": {
    id: "hv-deflect-cancel-hit-0-mo-blade-drawn",
    label: "Mo Blade Drawn",
    conditions: [{ buffId: "drawn:Mo Blade", op: "gte", stacks: 1 }],
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    castFrames: 18,
  },
}

// The Mo Blade drawn reads 3.06 f longer than the Snowparting Blade drawn
// this app's rotations always deflect with.
function healDeflectDrawnVariant(skill: Record<string, unknown>): Record<string, unknown> {
  const variant = DRAWN_VARIANT_BY_SKILL_ID[String(skill.id)]
  if (!variant) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || only.frame !== 0 || !rowMatches(only, [0, 0, 0, 0])) return skill
  const existingVariants = Array.isArray(only.variants) ? only.variants : []
  if (existingVariants.some((entry) => isRecord(entry) && entry.id === variant.id)) return skill
  return {
    ...skill,
    hits: [{ ...only, variants: [...existingVariants, variant] }],
  }
}

const GAUNTLETS_DRAWN_CONDITION = { buffId: "drawn:Gauntlets", op: "gte", stacks: 1 }

const PERFECT_DODGE_IDS = new Set([
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
])

// A Perfect Dodge's own Binge Points grant needs the gauntlets drawn, on top
// of Carouse and Binge ≥ 100.
function healPerfectDodgeDrawnGate(skill: Record<string, unknown>): Record<string, unknown> {
  if (!PERFECT_DODGE_IDS.has(String(skill.id))) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || !Array.isArray(only.triggers)) return skill
  const triggerIndex = only.triggers.findIndex(
    (trigger) =>
      isRecord(trigger) &&
      trigger.kind === "applyBuff" &&
      trigger.targetId === "buff-bamboocutDraught-binge-points" &&
      trigger.cooldownFrames === 60,
  )
  if (triggerIndex === -1) return skill
  const trigger = only.triggers[triggerIndex] as Record<string, unknown>
  const conditions = Array.isArray(trigger.conditions) ? trigger.conditions : []
  if (conditions.some((condition) => isRecord(condition) && condition.buffId === "drawn:Gauntlets"))
    return skill
  const nextTrigger = { ...trigger, conditions: [...conditions, GAUNTLETS_DRAWN_CONDITION] }
  const nextTriggers = only.triggers.map((entry, index) =>
    index === triggerIndex ? nextTrigger : entry,
  )
  return { ...skill, hits: [{ ...only, triggers: nextTriggers }] }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  let next = healDeflectDrawnVariant(skill)
  next = healPerfectDodgeDrawnGate(next)
  return next
}

export const V47__weaponDrawnGates: CustomSkillMigration = {
  to: 47,
  name: "V47__weaponDrawnGates",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 47, skills }
  },
}
