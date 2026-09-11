import type { AttributeKey, GearLevel, GearSlot } from "../../engine/types"
import type { GearWordId } from "./statLines"

export type RetuneSlotGroup = "weapon" | "armour"

export function retuneSlotGroup(slot: GearSlot): RetuneSlotGroup {
  return slot === "leftWeapon" || slot === "rightWeapon" ? "weapon" : "armour"
}

export interface RetuneBand {
  min: number
  max: number
  star5Weight: number
  lowerStarWeight: number
}

export interface RetuneLine {
  word: GearWordId
  weight: number
  bands: readonly [RetuneBand, RetuneBand, RetuneBand]
}

type Range = readonly [number, number]

const STAR5_BAND_WEIGHTS = [0, 60, 40] as const
const LOWER_STAR_BAND_WEIGHTS = [40, 50, 10] as const

function bands(low: Range, mid: Range, high: Range): readonly [RetuneBand, RetuneBand, RetuneBand] {
  const ranges = [low, mid, high]
  return ranges.map(([min, max], index) => ({
    min,
    max,
    star5Weight: STAR5_BAND_WEIGHTS[index],
    lowerStarWeight: LOWER_STAR_BAND_WEIGHTS[index],
  })) as [RetuneBand, RetuneBand, RetuneBand]
}

interface LevelRanges {
  attackPair: readonly [Range, Range, Range]
  phys: readonly [Range, Range, Range]
  crit: readonly [Range, Range, Range]
  affinity: readonly [Range, Range, Range]
  attribute: readonly [Range, Range, Range]
}

// In-game gear retune pools, level 96/100/105, 5★ and 3★/4★ bands (2026-09-07).
const LEVEL_RANGES: Readonly<Partial<Record<GearLevel, LevelRanges>>> = {
  96: {
    attackPair: [
      [22.1, 30.9],
      [31, 39.8],
      [39.9, 44.2],
    ],
    phys: [
      [38.9, 54.5],
      [54.6, 70],
      [70.1, 77.8],
    ],
    crit: [
      [0.045, 0.063],
      [0.064, 0.081],
      [0.082, 0.09],
    ],
    affinity: [
      [0.022, 0.031],
      [0.032, 0.04],
      [0.041, 0.044],
    ],
    attribute: [
      [24.7, 34.6],
      [34.7, 44.5],
      [44.6, 49.4],
    ],
  },
  100: {
    attackPair: [
      [25.7, 36],
      [36.1, 46.3],
      [46.4, 51.4],
    ],
    phys: [
      [45.3, 63.4],
      [63.5, 81.5],
      [81.6, 90.6],
    ],
    crit: [
      [0.052, 0.073],
      [0.074, 0.094],
      [0.095, 0.104],
    ],
    affinity: [
      [0.026, 0.036],
      [0.037, 0.047],
      [0.048, 0.052],
    ],
    attribute: [
      [28.7, 40.2],
      [40.3, 51.7],
      [51.8, 57.4],
    ],
  },
  105: {
    attackPair: [
      [29.9, 41.9],
      [42, 53.8],
      [53.9, 59.8],
    ],
    phys: [
      [52.8, 73.9],
      [74, 95],
      [95.1, 105.6],
    ],
    crit: [
      [0.061, 0.085],
      [0.086, 0.11],
      [0.111, 0.122],
    ],
    affinity: [
      [0.03, 0.042],
      [0.043, 0.054],
      [0.055, 0.06],
    ],
    attribute: [
      [33.4, 46.8],
      [46.9, 60.1],
      [60.2, 66.8],
    ],
  },
}

const ATTACK_PAIR_WEIGHT = 1316
const MAX_PHYS_WEIGHT = 993
const CRIT_WEIGHT = 930
const AFFINITY_WEIGHT = 930
const MIN_PHYS_WEIGHT = 498
const ATTRIBUTE_WEIGHT = 335

function bellstrikeShape(attackWord: GearWordId, ranges: LevelRanges): readonly RetuneLine[] {
  return [
    { word: attackWord, weight: ATTACK_PAIR_WEIGHT, bands: bands(...ranges.attackPair) },
    { word: "maxPhys", weight: MAX_PHYS_WEIGHT, bands: bands(...ranges.phys) },
    { word: "crit", weight: CRIT_WEIGHT, bands: bands(...ranges.crit) },
    { word: "affinity", weight: AFFINITY_WEIGHT, bands: bands(...ranges.affinity) },
    { word: "power", weight: ATTRIBUTE_WEIGHT, bands: bands(...ranges.attribute) },
    { word: "momentum", weight: ATTRIBUTE_WEIGHT, bands: bands(...ranges.attribute) },
  ]
}

function otherShape(attackWord: GearWordId, ranges: LevelRanges): readonly RetuneLine[] {
  return [
    { word: attackWord, weight: ATTACK_PAIR_WEIGHT, bands: bands(...ranges.attackPair) },
    { word: "maxPhys", weight: MAX_PHYS_WEIGHT, bands: bands(...ranges.phys) },
    { word: "crit", weight: CRIT_WEIGHT, bands: bands(...ranges.crit) },
    { word: "minPhys", weight: MIN_PHYS_WEIGHT, bands: bands(...ranges.phys) },
    { word: "power", weight: ATTRIBUTE_WEIGHT, bands: bands(...ranges.attribute) },
    { word: "agility", weight: ATTRIBUTE_WEIGHT, bands: bands(...ranges.attribute) },
  ]
}

type ShapeBuilder = (attackWord: GearWordId, ranges: LevelRanges) => readonly RetuneLine[]

function buildAttributePools(
  weaponAttackWord: GearWordId,
  armourAttackWord: GearWordId,
  shape: ShapeBuilder,
): Partial<Record<GearLevel, Readonly<Record<RetuneSlotGroup, readonly RetuneLine[]>>>> {
  const out: Partial<Record<GearLevel, Record<RetuneSlotGroup, readonly RetuneLine[]>>> = {}
  for (const [levelKey, ranges] of Object.entries(LEVEL_RANGES)) {
    if (!ranges) continue
    const level = Number(levelKey) as GearLevel
    out[level] = {
      weapon: shape(weaponAttackWord, ranges),
      armour: shape(armourAttackWord, ranges),
    }
  }
  return out
}

// Every class on an attribute retunes towards the same library — see
// `RETUNEMENT_POOLS`. An attribute with no registered class has no entry here
// either, and `retuneWeightPool` returns null rather than a guess.
const RETUNE_WEIGHTS: Partial<
  Record<
    AttributeKey,
    Partial<Record<GearLevel, Readonly<Record<RetuneSlotGroup, readonly RetuneLine[]>>>>
  >
> = {
  Bellstrike: buildAttributePools("maxFormless", "maxBellstrike", bellstrikeShape),
  Stonesplit: buildAttributePools("maxFormless", "maxStonesplit", otherShape),
  Silkbind: buildAttributePools("maxFormless", "maxSilkbind", otherShape),
  Bamboocut: buildAttributePools("maxFormless", "maxBamboocut", otherShape),
}

export function retuneWeightPool(
  attribute: AttributeKey,
  level: GearLevel,
  slot: GearSlot,
): readonly RetuneLine[] | null {
  return RETUNE_WEIGHTS[attribute]?.[level]?.[retuneSlotGroup(slot)] ?? null
}
