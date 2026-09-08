import type { EnhancementLevels, EnhancementStat, GearSlot } from "../../engine/types"
import { GEAR_SLOTS } from "../../engine/types"
import {
  AVERAGE_ENHANCEMENT_BONUS_LEVELS,
  CHEST_GREAVES_ENHANCEMENT_LEVELS,
  DISC_PENDANT_ENHANCEMENT_LEVELS,
  HELM_BRACER_ENHANCEMENT_LEVELS,
  WEAPON_ENHANCEMENT_LEVELS,
} from "../../data/baseStats"
import type { LadderLevels } from "./enhancementLadderDef"

export const DEFAULT_ENHANCEMENT_LEVEL = 65

// The ladder has no rows past this level in any container — see the season
// ceiling table below, which can technically exceed it.
const LADDER_CEILING = 65

type EnhancementProfile = "weapon" | "discPendant" | "helmBracer" | "chestGreaves"

const PROFILE_BY_SLOT: Readonly<Record<GearSlot, EnhancementProfile>> = {
  leftWeapon: "weapon",
  rightWeapon: "weapon",
  disc: "discPendant",
  pendant: "discPendant",
  helm: "helmBracer",
  bracer: "helmBracer",
  armor: "chestGreaves",
  greaves: "chestGreaves",
}

export function defaultEnhancementLevels(): EnhancementLevels {
  const out = {} as EnhancementLevels
  for (const slot of GEAR_SLOTS) out[slot] = DEFAULT_ENHANCEMENT_LEVEL
  return out
}

export const DEFAULT_ENHANCEMENTS: EnhancementLevels = defaultEnhancementLevels()

function rowAt<Row>(rows: LadderLevels<Row>, level: number): Row | undefined {
  return rows[Math.min(level, rows.length) - 1]
}

export function enhancementStatsAtLevel(
  slot: GearSlot,
  level: number,
): Readonly<Partial<Record<EnhancementStat, number>>> {
  if (level <= 0) return {}
  switch (PROFILE_BY_SLOT[slot]) {
    case "weapon": {
      const row = rowAt(WEAPON_ENHANCEMENT_LEVELS, level)
      return row ? { minPhys: row.minPhys, maxPhys: row.maxPhys } : {}
    }
    case "discPendant": {
      const row = rowAt(DISC_PENDANT_ENHANCEMENT_LEVELS, level)
      return row ? { maxPhys: row.maxPhys } : {}
    }
    case "helmBracer": {
      const row = rowAt(HELM_BRACER_ENHANCEMENT_LEVELS, level)
      return row ? { maxHp: row.maxHp } : {}
    }
    case "chestGreaves": {
      const row = rowAt(CHEST_GREAVES_ENHANCEMENT_LEVELS, level)
      return row ? { maxHp: row.maxHp, physDef: row.physDef } : {}
    }
  }
}

function levelForRows<Row>(rows: LadderLevels<Row>, stat: string, value: number): number {
  let level = 0
  for (let index = 0; index < rows.length; index++) {
    const rowValue = (rows[index] as unknown as Record<string, number | undefined>)[stat]
    if (rowValue === undefined || rowValue > value) break
    level = index + 1
  }
  return level
}

// Used only to migrate a saved profile off the old per-stat value model.
export function levelForEnhancementValue(slot: GearSlot, stat: string, value: number): number {
  switch (PROFILE_BY_SLOT[slot]) {
    case "weapon":
      return levelForRows(WEAPON_ENHANCEMENT_LEVELS, stat, value)
    case "discPendant":
      return levelForRows(DISC_PENDANT_ENHANCEMENT_LEVELS, stat, value)
    case "helmBracer":
      return levelForRows(HELM_BRACER_ENHANCEMENT_LEVELS, stat, value)
    case "chestGreaves":
      return levelForRows(CHEST_GREAVES_ENHANCEMENT_LEVELS, stat, value)
  }
}

export function enhancementContributions(levels: EnhancementLevels): Record<string, number> {
  const out: Record<string, number> = {}
  for (const slot of GEAR_SLOTS) {
    const stats = enhancementStatsAtLevel(slot, levels[slot] ?? 0)
    if (stats.minPhys) out["phys.min"] = (out["phys.min"] ?? 0) + stats.minPhys
    if (stats.maxPhys) out["phys.max"] = (out["phys.max"] ?? 0) + stats.maxPhys
  }
  return out
}

export function enhancementHpTotal(levels: EnhancementLevels): number {
  let hp = 0
  for (const slot of GEAR_SLOTS) hp += enhancementStatsAtLevel(slot, levels[slot] ?? 0).maxHp ?? 0
  return hp
}

export function enhancementPhysDefTotal(levels: EnhancementLevels): number {
  let physDef = 0
  for (const slot of GEAR_SLOTS) {
    physDef += enhancementStatsAtLevel(slot, levels[slot] ?? 0).physDef ?? 0
  }
  return physDef
}

export function averageEnhancementLevel(levels: EnhancementLevels): number {
  const sum = GEAR_SLOTS.reduce((total, slot) => total + (levels[slot] ?? 0), 0)
  return Math.floor(sum / GEAR_SLOTS.length)
}

export interface AverageEnhancementBonus {
  maxHp: number
  percent: number
}

export function averageEnhancementBonus(levels: EnhancementLevels): AverageEnhancementBonus {
  const average = averageEnhancementLevel(levels)
  // Rows sit every 5th level starting at 5, so the row index is level / 5 − 1.
  const index = Math.min(Math.floor(average / 5) - 1, AVERAGE_ENHANCEMENT_BONUS_LEVELS.length - 1)
  const row = index >= 0 ? AVERAGE_ENHANCEMENT_BONUS_LEVELS[index] : undefined
  return row ? { maxHp: row.maxHp, percent: row.percent } : { maxHp: 0, percent: 0 }
}

interface EnhancementCapTier {
  level: number
  reqGearLevel: number
  reqWorldLevel: number
}

// In-game values as of 2026-09-07: the gear level and world level each
// enhancement cap requires.
const CAP_TIERS: readonly EnhancementCapTier[] = [
  { level: 2, reqGearLevel: 1, reqWorldLevel: 0 },
  { level: 5, reqGearLevel: 16, reqWorldLevel: 0 },
  { level: 10, reqGearLevel: 31, reqWorldLevel: 0 },
  { level: 15, reqGearLevel: 41, reqWorldLevel: 0 },
  { level: 20, reqGearLevel: 51, reqWorldLevel: 0 },
  { level: 25, reqGearLevel: 56, reqWorldLevel: 0 },
  { level: 30, reqGearLevel: 61, reqWorldLevel: 0 },
  { level: 35, reqGearLevel: 71, reqWorldLevel: 0 },
  { level: 40, reqGearLevel: 81, reqWorldLevel: 0 },
  { level: 45, reqGearLevel: 86, reqWorldLevel: 0 },
  { level: 50, reqGearLevel: 91, reqWorldLevel: 14 },
  { level: 55, reqGearLevel: 91, reqWorldLevel: 15 },
  { level: 60, reqGearLevel: 96, reqWorldLevel: 16 },
  { level: 65, reqGearLevel: 96, reqWorldLevel: 17 },
  { level: 70, reqGearLevel: 100, reqWorldLevel: 18 },
  { level: 75, reqGearLevel: 100, reqWorldLevel: 19 },
  { level: 80, reqGearLevel: 105, reqWorldLevel: 20 },
  { level: 85, reqGearLevel: 105, reqWorldLevel: 21 },
]

interface SeasonCeiling {
  worldLevel: number
  ceiling: number
}

// In-game values as of 2026-09-07, keyed by the world level each season
// introduces. A season's
// ceiling governs every world level from the previous season's threshold up
// to and including its own.
const SEASON_CEILINGS: readonly SeasonCeiling[] = [
  { worldLevel: 11, ceiling: 35 },
  { worldLevel: 13, ceiling: 45 },
  { worldLevel: 15, ceiling: 55 },
  { worldLevel: 17, ceiling: 65 },
  { worldLevel: 19, ceiling: 75 },
  { worldLevel: 21, ceiling: 80 },
]

function seasonCeilingFor(breakthrough: number): number {
  const season =
    SEASON_CEILINGS.find((candidate) => candidate.worldLevel >= breakthrough) ??
    SEASON_CEILINGS[SEASON_CEILINGS.length - 1]!
  return season.ceiling
}

export function enhancementCap(pieceGearLevel: number, breakthrough: number): number {
  let raw = 0
  for (let i = CAP_TIERS.length - 1; i >= 0; i--) {
    const tier = CAP_TIERS[i]!
    if (pieceGearLevel >= tier.reqGearLevel && breakthrough >= tier.reqWorldLevel) {
      raw = tier.level
      break
    }
  }
  return Math.min(raw, seasonCeilingFor(breakthrough), LADDER_CEILING)
}
