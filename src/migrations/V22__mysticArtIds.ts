// v21 → v22 — every mystic art became one class-less module under the
// `mystic` id segment, and its debuffs went with it, so the per-class ids a
// saved rotation names no longer resolve. The class prefixes and slugs are
// frozen here rather than read from the live library, for the same reason
// V14 and V15 froze their set ids: a later rename needs its own step.
import type { Migration, RawProfilesBlob } from "./types"

const MYSTIC_CLASS_ID = "mystic"

const CLASS_PREFIXES = [
  "bellstrikeUmbra",
  "bellstrikeSplendor",
  "stonesplitStrength",
  "silkbindJade",
  "bamboocutDraught",
]

const MYSTIC_ART_SLUGS = new Set([
  "dragon-fire-smolder-1-hit",
  "dragon-fire-smolder-2-hits",
  "dragon-head-plus",
  "dragon-head",
  "drunkenpoet-prepull",
  "fire-breath-1-hit-prepull",
  "fire-breath-1-hit",
  "fire-breath-2-hit",
  "flute-of-the-tides-cancel",
  "flute-of-the-tides-full",
  "flute-of-the-tides-prepull",
  "poet-final-hit-cancel",
  "poet1",
  "poet2",
  "poet3",
  "poet4",
  "soaring-1-hit",
  "soaring",
  "toad-cancel",
])

const MYSTIC_DEBUFF_SLUGS: Record<string, string> = {
  combustion: "combustion",
  "dark-fire": "smolder",
  "flute-ripple": "flute-ripple",
  "toad-poison": "toad-poison",
}

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function classSlugOf(id: string, prefix: string): string | null {
  for (const classId of CLASS_PREFIXES) {
    const head = `${prefix}${classId}-`
    if (id.startsWith(head)) return id.slice(head.length)
  }
  return null
}

export function migrateMysticId<T>(id: T): T {
  if (typeof id !== "string") return id
  const debuffSlug = classSlugOf(id, "debuff-")
  if (debuffSlug !== null) {
    const shared = MYSTIC_DEBUFF_SLUGS[debuffSlug]
    return (shared ? `debuff-${MYSTIC_CLASS_ID}-${shared}` : id) as T
  }
  const skillSlug = classSlugOf(id, "")
  if (skillSlug !== null && MYSTIC_ART_SLUGS.has(skillSlug)) {
    return `${MYSTIC_CLASS_ID}-${skillSlug}` as T
  }
  return id
}

export function isMysticArtId(id: unknown): boolean {
  return typeof id === "string" && id !== migrateMysticId(id)
}

export function mysticClassIdFor(id: string, classId: unknown): unknown {
  return id.startsWith(`${MYSTIC_CLASS_ID}-`) || id.startsWith(`debuff-${MYSTIC_CLASS_ID}-`)
    ? MYSTIC_CLASS_ID
    : classId
}

export function migrateRotationMysticIds<T>(rotation: T): T {
  if (!isRec(rotation)) return rotation
  const next: Record<string, unknown> = { ...rotation }
  if (Array.isArray(rotation.steps)) {
    next.steps = rotation.steps.map((step) =>
      isRec(step) ? { ...step, skillId: migrateMysticId(step.skillId) } : step,
    )
  }
  if (Array.isArray(rotation.permanentBuffIds)) {
    next.permanentBuffIds = rotation.permanentBuffIds.map(migrateMysticId)
  }
  return next as T
}

export const V22__mysticArtIds: Migration = {
  to: 22,
  name: "V22__mysticArtIds",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) => {
          if (!isRec(profile) || !isRec(profile.inputs)) return profile
          if (!("activeCustomRotation" in profile.inputs)) return profile
          return {
            ...profile,
            inputs: {
              ...profile.inputs,
              activeCustomRotation: migrateRotationMysticIds(profile.inputs.activeCustomRotation),
            },
          }
        })
      : blob.profiles
    return { ...blob, v: 22, profiles }
  },
}
