// v52 → v53 — Gourd Toss rank 4+ now also opens Flying Tornado at Peak's
// Springless Silence's own end, and Forsaken Fame now reads it as a faster
// charge. A Skill Editor copy seeded before this still lacks both.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SPECIAL_SKILL_ID = "silkbindJade-fanspecial"
const LIGHT_CHARGED_SKILL_ID = "silkbindJade-fanlightcharged"
const FLYING_TORNADO_ID = "gourdTossFlyingTornado"

function alreadyGrantsFlyingTornado(triggers: unknown): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) && trigger.kind === "applyBuff" && trigger.targetId === FLYING_TORNADO_ID,
    )
  )
}

function healFanspecial(skill: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(skill.hits)) return skill
  const targetHitIndex = skill.hits.length - 1
  const hits = skill.hits.map((hitValue, index) => {
    if (index !== targetHitIndex || !isRecord(hitValue)) return hitValue
    const existingTriggers = Array.isArray(hitValue.triggers) ? hitValue.triggers : []
    if (alreadyGrantsFlyingTornado(existingTriggers)) return hitValue
    return {
      ...hitValue,
      triggers: [
        ...existingTriggers,
        {
          kind: "applyBuff",
          targetId: FLYING_TORNADO_ID,
          stacks: 1,
          condition: null,
          appliesOnCastEnd: true,
          requiresParam: "gourdToss",
          requiresMinTier: 4,
        },
      ],
    }
  })
  return { ...skill, hits }
}

const FLYING_TORNADO_VARIANT = {
  id: "hv-fanlightcharged-hit-0-flying-tornado",
  label: "Flying Tornado",
  conditions: [{ buffId: FLYING_TORNADO_ID, op: "gte", stacks: 1 }],
  physMultiplier: 1.9044,
  attributeMultiplier: 2.8566,
  physFixed: 527,
  attributeFixed: 287,
  frame: 60,
  castFrames: 86,
}

function alreadyCarriesFlyingTornadoVariant(variants: unknown): boolean {
  return (
    Array.isArray(variants) &&
    variants.some((variant) => isRecord(variant) && variant.id === FLYING_TORNADO_VARIANT.id)
  )
}

function healFanlightcharged(skill: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(skill.hits)) return skill
  const hits = skill.hits.map((hitValue, index) => {
    if (index !== 0 || !isRecord(hitValue)) return hitValue
    const existingVariants = Array.isArray(hitValue.variants) ? hitValue.variants : []
    if (alreadyCarriesFlyingTornadoVariant(existingVariants)) return hitValue
    return { ...hitValue, variants: [...existingVariants, FLYING_TORNADO_VARIANT] }
  })
  return { ...skill, hits }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === SPECIAL_SKILL_ID) return healFanspecial(skill)
  if (skill.id === LIGHT_CHARGED_SKILL_ID) return healFanlightcharged(skill)
  return skill
}

export const V53__gourdTossFlyingTornado: CustomSkillMigration = {
  to: 53,
  name: "V53__gourdTossFlyingTornado",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 53, skills }
  },
}
