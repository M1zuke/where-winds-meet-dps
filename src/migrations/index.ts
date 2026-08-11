import type { Migration, MigrationRunResult, RawProfilesBlob } from "./types"
import { V5__englishIdsWithoutSitePrefix } from "./V5__englishIdsWithoutSitePrefix"
import { V6__dropDerivedStats } from "./V6__dropDerivedStats"
import { V7__clampSingleMysticWordRoll } from "./V7__clampSingleMysticWordRoll"
import { V8__setIdsWithoutDisplayName } from "./V8__setIdsWithoutDisplayName"

export type { Migration, MigrationRunResult, RawProfilesBlob } from "./types"
export {
  migrateClassId,
  migrateEntityId,
  LEGACY_CLASS_IDS,
} from "./V5__englishIdsWithoutSitePrefix"
export { migrateSetId } from "./V8__setIdsWithoutDisplayName"

export const PROFILE_MIGRATIONS: readonly Migration[] = [
  V5__englishIdsWithoutSitePrefix,
  V6__dropDerivedStats,
  V7__clampSingleMysticWordRoll,
  V8__setIdsWithoutDisplayName,
]

const VERSION_BEFORE_THIS_FOLDER = 4

export const LATEST_PROFILES_VERSION = PROFILE_MIGRATIONS.reduce(
  (max, m) => Math.max(max, m.to),
  VERSION_BEFORE_THIS_FOLDER,
)

export function runProfileMigrations(input: unknown): MigrationRunResult | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const applied: string[] = []
  const notes: string[] = []
  const source = input as RawProfilesBlob

  const rawVersion = typeof source.v === "number" && Number.isFinite(source.v) ? source.v : 0
  if (rawVersion !== source.v) notes.push(`missing/invalid version, treated as ${rawVersion}`)

  // A downgrade must not shred data a newer build wrote.
  if (rawVersion > LATEST_PROFILES_VERSION) {
    notes.push(`blob v${rawVersion} is newer than v${LATEST_PROFILES_VERSION} — left untouched`)
    return { blob: source, applied, notes }
  }

  const byTarget = new Map(PROFILE_MIGRATIONS.map((m) => [m.to, m]))
  let blob: RawProfilesBlob = source

  for (let target = rawVersion + 1; target <= LATEST_PROFILES_VERSION; target++) {
    const step = byTarget.get(target)
    if (!step) {
      notes.push(`no migration to v${target} — passed through`)
      blob = { ...blob, v: target }
      continue
    }
    try {
      const next = step.migrate(blob)
      if (!next || typeof next !== "object") throw new Error("step returned a non-object")
      blob = { ...next, v: target }
      applied.push(step.name)
    } catch (e) {
      notes.push(`${step.name} failed (${(e as Error)?.message ?? e}) — blob kept unchanged`)
      blob = { ...blob, v: target }
    }
  }

  return { blob, applied, notes }
}
