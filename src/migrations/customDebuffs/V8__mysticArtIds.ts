// v7 → v8 — a Skill Editor copy of a mystic art's debuff was seeded under the
// class it was opened from; the built-in it shadows now carries the shared
// `mystic` id, and so must the copy. Two class copies of one debuff cannot
// both take the shared id: the first keeps it, the rest stay class-bound.
import { migrateEntityId } from "../V5__englishIdsWithoutSitePrefix"
import { migrateMysticId, mysticClassIdFor } from "../V26__mysticArtIds"
import type { CustomDebuffMigration, RawCustomDebuffsBlob } from "./types"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const migrateReference = (id: unknown): unknown => migrateMysticId(migrateEntityId(id))

export function migrateMysticDebuffReferences(debuff: unknown): unknown {
  if (!isRec(debuff)) return debuff
  const next: Record<string, unknown> = { ...debuff }
  if (isRec(debuff.dot) && "sourceSkillId" in debuff.dot) {
    next.dot = { ...debuff.dot, sourceSkillId: migrateReference(debuff.dot.sourceSkillId) }
  }
  if (isRec(debuff.detonation)) {
    next.detonation = { ...debuff.detonation, skillId: migrateReference(debuff.detonation.skillId) }
  }
  return next
}

export const V8__mysticArtIds: CustomDebuffMigration = {
  to: 8,
  name: "V8__mysticArtIds",
  migrate(blob: RawCustomDebuffsBlob): RawCustomDebuffsBlob {
    if (!Array.isArray(blob.debuffs)) return { ...blob, v: 8 }
    const storedIds = new Set(
      blob.debuffs.map((debuff) => (isRec(debuff) ? debuff.id : undefined)).filter(Boolean),
    )
    const claimed = new Set<unknown>()
    const debuffs = blob.debuffs.map((debuff) => {
      const withReferences = migrateMysticDebuffReferences(debuff)
      if (!isRec(withReferences) || typeof withReferences.id !== "string") return withReferences
      const sharedId = migrateReference(withReferences.id) as string
      const takesSharedId =
        sharedId !== withReferences.id && !storedIds.has(sharedId) && !claimed.has(sharedId)
      if (!takesSharedId) return withReferences
      claimed.add(sharedId)
      return {
        ...withReferences,
        id: sharedId,
        classId: mysticClassIdFor(sharedId, withReferences.classId),
      }
    })
    return { ...blob, v: 8, debuffs }
  },
}
