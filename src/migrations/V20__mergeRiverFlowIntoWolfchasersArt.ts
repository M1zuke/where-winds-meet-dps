// v19 -> v20 — the class gate `buff-bellstrikeUmbra-river-flow` and the
// Wolfchaser's Art buff `potentRiverFlow` were two records of one in-game
// state; the gate is gone and the surviving id is the module's. A stored
// condition still naming the gate would never hold again.
import type { Migration, RawProfilesBlob } from "./types"

const LEGACY_BUFF_ID = "buff-bellstrikeUmbra-river-flow"
const RIVER_FLOW_BUFF_ID = "potentRiverFlow"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function migrateRiverFlowBuffId(buffId: string): string {
  return buffId === LEGACY_BUFF_ID ? RIVER_FLOW_BUFF_ID : buffId
}

function migrateId(value: unknown): unknown {
  return typeof value === "string" ? migrateRiverFlowBuffId(value) : value
}

function migrateCondition(condition: unknown): unknown {
  return isRec(condition) ? { ...condition, buffId: migrateId(condition.buffId) } : condition
}

function migrateConditions(value: unknown): unknown {
  return Array.isArray(value) ? value.map(migrateCondition) : value
}

function migrateTrigger(trigger: unknown): unknown {
  if (!isRec(trigger)) return trigger
  const next: Record<string, unknown> = { ...trigger, targetId: migrateId(trigger.targetId) }
  if ("condition" in trigger) next.condition = migrateCondition(trigger.condition)
  if ("conditions" in trigger) next.conditions = migrateConditions(trigger.conditions)
  return next
}

function migrateVariant(variant: unknown): unknown {
  if (!isRec(variant) || !("conditions" in variant)) return variant
  return { ...variant, conditions: migrateConditions(variant.conditions) }
}

function migrateHit(hit: unknown): unknown {
  if (!isRec(hit)) return hit
  const next: Record<string, unknown> = { ...hit }
  if (Array.isArray(hit.triggers)) next.triggers = hit.triggers.map(migrateTrigger)
  if (Array.isArray(hit.variants)) next.variants = hit.variants.map(migrateVariant)
  return next
}

function migrateEntityHits(entity: unknown): unknown {
  if (!isRec(entity) || !Array.isArray(entity.hits)) return entity
  return { ...entity, hits: entity.hits.map(migrateHit) }
}

function migrateOpeningStacks(stored: unknown): unknown {
  if (!isRec(stored)) return stored
  return Object.fromEntries(
    Object.entries(stored).map(([buffId, stacks]) => [migrateRiverFlowBuffId(buffId), stacks]),
  )
}

function migrateRotation(rotation: unknown): unknown {
  if (!isRec(rotation)) return rotation
  const next: Record<string, unknown> = { ...rotation }
  if (Array.isArray(rotation.permanentBuffIds)) {
    next.permanentBuffIds = rotation.permanentBuffIds.map(migrateId)
  }
  if ("openingStacks" in rotation) next.openingStacks = migrateOpeningStacks(rotation.openingStacks)
  return next
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...inputs }
  if (Array.isArray(inputs.customSkills))
    next.customSkills = inputs.customSkills.map(migrateEntityHits)
  if (Array.isArray(inputs.customDebuffs))
    next.customDebuffs = inputs.customDebuffs.map(migrateEntityHits)
  if ("activeCustomRotation" in inputs) {
    next.activeCustomRotation = migrateRotation(inputs.activeCustomRotation)
  }
  return next
}

export const V20__mergeRiverFlowIntoWolfchasersArt: Migration = {
  to: 20,
  name: "V20__mergeRiverFlowIntoWolfchasersArt",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 20, profiles }
  },
}
