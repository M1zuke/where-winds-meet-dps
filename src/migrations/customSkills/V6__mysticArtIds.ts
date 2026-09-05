// v5 → v6 — a Skill Editor copy of a mystic art was seeded under the class it
// was opened from; the built-in it shadows now carries the shared `mystic`
// id, and so must the copy, or the override silently stops applying. Every
// reference a copy holds to a mystic art or its debuffs moves the same way.
// Two class copies of one mystic art cannot both take the shared id: the
// first keeps it, the rest stay as the class-bound user skills they already
// behave as.
import { migrateEntityId } from "../V5__englishIdsWithoutSitePrefix"
import { migrateMysticId, mysticClassIdFor } from "../V22__mysticArtIds"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const migrateReference = (id: unknown): unknown => migrateMysticId(migrateEntityId(id))

function migrateCondition(condition: unknown): unknown {
  return isRec(condition) ? { ...condition, buffId: migrateReference(condition.buffId) } : condition
}

function migrateConditions(conditions: unknown): unknown {
  return Array.isArray(conditions) ? conditions.map(migrateCondition) : conditions
}

function migrateTrigger(trigger: unknown): unknown {
  if (!isRec(trigger)) return trigger
  const next: Record<string, unknown> = { ...trigger, targetId: migrateReference(trigger.targetId) }
  if ("condition" in trigger) next.condition = migrateCondition(trigger.condition)
  if ("conditions" in trigger) next.conditions = migrateConditions(trigger.conditions)
  if ("transferFrom" in trigger) next.transferFrom = migrateReference(trigger.transferFrom)
  return next
}

export function migrateMysticSkillHit(hit: unknown): unknown {
  if (!isRec(hit)) return hit
  const next: Record<string, unknown> = { ...hit }
  if (Array.isArray(hit.triggers)) next.triggers = hit.triggers.map(migrateTrigger)
  if ("conditions" in hit) next.conditions = migrateConditions(hit.conditions)
  if (Array.isArray(hit.variants)) {
    next.variants = hit.variants.map((variant) =>
      isRec(variant) ? { ...variant, conditions: migrateConditions(variant.conditions) } : variant,
    )
  }
  return next
}

export const V6__mysticArtIds: CustomSkillMigration = {
  to: 6,
  name: "V6__mysticArtIds",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    if (!Array.isArray(blob.skills)) return { ...blob, v: 6 }
    const storedIds = new Set(
      blob.skills.map((skill) => (isRec(skill) ? skill.id : undefined)).filter(Boolean),
    )
    const claimed = new Set<unknown>()
    const skills = blob.skills.map((skill) => {
      if (!isRec(skill) || typeof skill.id !== "string") return skill
      const hits = Array.isArray(skill.hits) ? skill.hits.map(migrateMysticSkillHit) : skill.hits
      const sharedId = migrateReference(skill.id) as string
      const takesSharedId =
        sharedId !== skill.id && !storedIds.has(sharedId) && !claimed.has(sharedId)
      if (!takesSharedId) return { ...skill, hits }
      claimed.add(sharedId)
      return { ...skill, id: sharedId, classId: mysticClassIdFor(sharedId, skill.classId), hits }
    })
    return { ...blob, v: 6, skills }
  },
}
