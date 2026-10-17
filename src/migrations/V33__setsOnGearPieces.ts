// v32 → v33 — the gear set moves off the build onto the pieces carrying it,
// and the bow set becomes a Bow and Thumb Ring pair that each carry a level.
// `inputs.set` is written onto every piece equipped in a set-bearing slot;
// `inputs.bowSet` becomes two legendary bow pieces at the gear level the
// profile's breakthrough mapped to; below gear level 91 no bow piece exists and
// both stay empty. The breakthrough table is frozen at the mapping this step
// replaces. A set of the
// armor group is not modelled and is only removed from the build.
import type { Migration, RawProfilesBlob } from "./types"

const SET_BEARING_SLOTS = ["leftWeapon", "rightWeapon", "disc", "pendant"] as const

const ARMOR_GROUP_SET_IDS: readonly string[] = ["calmwaters"]

const BOW_GEAR_LEVELS = [91, 96, 100, 105] as const

const GEAR_LEVEL_BY_BREAKTHROUGH: Readonly<Record<number, number>> = {
  13: 86,
  14: 91,
  15: 91,
  16: 96,
  17: 96,
  18: 100,
  19: 100,
  20: 105,
  21: 105,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== ""
}

function bowLevelForBreakthrough(breakthrough: unknown): number | null {
  const known = Object.keys(GEAR_LEVEL_BY_BREAKTHROUGH).map(Number)
  const atOrBelow =
    typeof breakthrough === "number" ? known.filter((entry) => entry <= breakthrough) : []
  const tier = atOrBelow.length > 0 ? Math.max(...atOrBelow) : Math.min(...known)
  const gearLevel = GEAR_LEVEL_BY_BREAKTHROUGH[tier]
  if (gearLevel < BOW_GEAR_LEVELS[0]) return null
  return BOW_GEAR_LEVELS.find((level) => level >= gearLevel) ?? null
}

function bowGearFromBowSet(inputs: Record<string, unknown>): Record<string, unknown> {
  const level = bowLevelForBreakthrough(inputs.breakthrough)
  if (!isNonEmptyString(inputs.bowSet) || level === null) return { bow: null, thumbRing: null }
  const piece = {
    level,
    rarity: "legendary",
    set: inputs.bowSet,
  }
  return { bow: { ...piece }, thumbRing: { ...piece } }
}

function equippedSetBearingIds(inputs: Record<string, unknown>): Set<string> {
  const ids = new Set<string>()
  if (!isRecord(inputs.equipped)) return ids
  for (const slot of SET_BEARING_SLOTS) {
    const id = inputs.equipped[slot]
    if (isNonEmptyString(id)) ids.add(id)
  }
  return ids
}

export function moveSetsOntoGearPieces(inputs: Record<string, unknown>): Record<string, unknown> {
  const { set, bowSet: _bowSet, ...rest } = inputs
  void _bowSet
  const bowGear = isRecord(inputs.bowGear) ? inputs.bowGear : bowGearFromBowSet(inputs)
  if (
    !isNonEmptyString(set) ||
    ARMOR_GROUP_SET_IDS.includes(set) ||
    !Array.isArray(inputs.inventory)
  ) {
    return { ...rest, bowGear }
  }

  const carriers = equippedSetBearingIds(inputs)
  const inventory = inputs.inventory.map((piece) =>
    isRecord(piece) &&
    isNonEmptyString(piece.id) &&
    carriers.has(piece.id) &&
    !isNonEmptyString(piece.set)
      ? { ...piece, set }
      : piece,
  )
  return { ...rest, inventory, bowGear }
}

export const V33__setsOnGearPieces: Migration = {
  to: 33,
  name: "V33__setsOnGearPieces",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRecord(profile) && isRecord(profile.inputs)
            ? { ...profile, inputs: moveSetsOntoGearPieces(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 33, profiles }
  },
}
