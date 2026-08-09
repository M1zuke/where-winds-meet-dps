// v4 → v5 — drop the `site-` id namespace and replace pinyin class ids.
// An unresolved id costs damage silently: no crash, no warning, no type error.
import type { Migration, RawProfilesBlob } from "./types"

type Rec = Record<string, unknown>

export const LEGACY_CLASS_IDS: Record<string, string> = {
  mingJinHong: "bellstrikeRainbow",
  mingJinYing: "bellstrikeUmbra",
  qianSiYu: "silkbindJade",
  lieShiWei: "stonesplitPower",
  lieShiJunChunTang: "stonesplitStrength",
  poZhuFeng: "bamboocutWindTwinblade",
  poZhuChen: "bamboocutDust",
  lieShiJunShuangQie: "stonesplitStrength",
}

/**
 * `site-mingJinYing-swordq`          → `bellstrikeUmbra-swordq`
 * `site-buff-mingJinYing-river-flow` → `buff-bellstrikeUmbra-river-flow`
 * `site-debuff-mingJinYing-bleed`    → `debuff-bellstrikeUmbra-bleed`
 * `builtin-mingJinYing-eazy-t6-wolf` → `builtin-bellstrikeUmbra-eazy-t6-wolf`
 */
export function migrateEntityId<T>(id: T): T {
  if (typeof id !== "string" || !id) return id
  let out: string = id
  if (out.startsWith("site-buff-")) out = `buff-${out.slice("site-buff-".length)}`
  else if (out.startsWith("site-debuff-")) out = `debuff-${out.slice("site-debuff-".length)}`
  else if (out.startsWith("site-")) out = out.slice("site-".length)
  for (const [legacy, renamed] of Object.entries(LEGACY_CLASS_IDS)) {
    if (out.includes(legacy)) out = out.split(legacy).join(renamed)
  }
  return out as unknown as T
}

export function migrateClassId<T>(classId: T): T {
  if (typeof classId !== "string") return classId
  return (LEGACY_CLASS_IDS[classId] ?? classId) as unknown as T
}

const isRec = (x: unknown): x is Rec => !!x && typeof x === "object" && !Array.isArray(x)

function migrateRotation(rotation: unknown): unknown {
  if (!isRec(rotation)) return rotation
  const next: Rec = {
    ...rotation,
    id: migrateEntityId(rotation.id),
    classId: migrateClassId(rotation.classId),
  }
  if (Array.isArray(rotation.steps)) {
    next.steps = rotation.steps.map((s) =>
      isRec(s) ? { ...s, skillId: migrateEntityId(s.skillId) } : s,
    )
  }
  if (Array.isArray(rotation.permanentBuffIds)) {
    next.permanentBuffIds = rotation.permanentBuffIds.map((b) => migrateEntityId(b))
  }
  return next
}

function migrateHit(hit: unknown): unknown {
  if (!isRec(hit)) return hit
  if (!Array.isArray(hit.triggers)) return hit
  return {
    ...hit,
    triggers: hit.triggers.map((t) =>
      isRec(t) ? { ...t, targetId: migrateEntityId(t.targetId) } : t,
    ),
  }
}

function migrateSkill(skill: unknown): unknown {
  if (!isRec(skill)) return skill
  const next: Rec = {
    ...skill,
    id: migrateEntityId(skill.id),
    classId: migrateClassId(skill.classId),
  }
  if (Array.isArray(skill.hits)) next.hits = skill.hits.map(migrateHit)
  return next
}

function migrateStatus(status: unknown): unknown {
  if (!isRec(status)) return status
  const next: Rec = {
    ...status,
    id: migrateEntityId(status.id),
    classId: migrateClassId(status.classId),
  }
  if (isRec(status.detonation) && typeof status.detonation.skillId === "string") {
    next.detonation = {
      ...status.detonation,
      skillId: migrateEntityId(status.detonation.skillId),
    }
  }
  return next
}

function migrateInputs(inputs: unknown): unknown {
  if (!isRec(inputs)) return inputs
  const next: Rec = {
    ...inputs,
    classId: migrateClassId(inputs.classId),
    selectedBuiltinRotationId: migrateEntityId(inputs.selectedBuiltinRotationId),
  }

  if (next.activeCustomRotation != null) {
    next.activeCustomRotation = migrateRotation(next.activeCustomRotation)
  }
  for (const key of ["customSkills"] as const) {
    if (Array.isArray(next[key])) next[key] = (next[key] as unknown[]).map(migrateSkill)
  }
  for (const key of ["customBuffs", "customDebuffs"] as const) {
    if (Array.isArray(next[key])) next[key] = (next[key] as unknown[]).map(migrateStatus)
  }

  if ("siteBuffParams" in next) {
    if (next.buffParams == null) next.buffParams = next.siteBuffParams
    delete next.siteBuffParams
  }
  return next
}

export const V5__englishIdsWithoutSitePrefix: Migration = {
  to: 5,
  name: "V5__englishIdsWithoutSitePrefix",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((p) => (isRec(p) ? { ...p, inputs: migrateInputs(p.inputs) } : p))
      : blob.profiles
    return { ...blob, v: 5, profiles }
  },
}
