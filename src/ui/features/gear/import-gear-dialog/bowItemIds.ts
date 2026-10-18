import type { BowGearLevel, BowSlot, GearRarity } from "../../../../engine/types"

export type BowItemReading =
  | { kind: "importable"; part: BowSlot; level: BowGearLevel; rarity: GearRarity }
  | { kind: "carriesNoBowSet" }

// In-game values as of 2026-10-17.
const FIRST_BOW_ITEM_ID = 1101400
const LAST_BOW_ITEM_ID = 1101899

const LEVEL_BY_TIER: Readonly<Record<number, BowGearLevel | null>> = {
  14: null,
  15: 91,
  16: 96,
  17: 100,
  18: 105,
}

const STAR_BY_OFFSET_FLOOR: readonly { floor: number; rarity: GearRarity | null }[] = [
  { floor: 67, rarity: "legendary" },
  { floor: 37, rarity: "epic" },
  { floor: 7, rarity: null },
]

const STAR_SPAN = 5
const RING_OFFSET_IN_STAR = 0

export function parseBowItemId(itemId: number | null): BowItemReading {
  const carriesNoBowSet: BowItemReading = { kind: "carriesNoBowSet" }
  if (itemId === null || itemId < FIRST_BOW_ITEM_ID || itemId > LAST_BOW_ITEM_ID) {
    return carriesNoBowSet
  }
  const level = LEVEL_BY_TIER[Math.floor(itemId / 100) % 100]
  const star = STAR_BY_OFFSET_FLOOR.find(({ floor }) => {
    const offset = (itemId % 100) - floor
    return offset >= 0 && offset < STAR_SPAN
  })
  if (!level || !star?.rarity) return carriesNoBowSet
  const offsetInStar = (itemId % 100) - star.floor
  return {
    kind: "importable",
    part: offsetInStar === RING_OFFSET_IN_STAR ? "thumbRing" : "bow",
    level,
    rarity: star.rarity,
  }
}
