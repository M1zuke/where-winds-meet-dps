import type { GearLevel, GearRarity, GearSlot } from "./types"
import { isWeaponSlot } from "./types"
import type { GearBaseStats } from "../data/stats/gearBaseStats"
import { gearBaseStatsFor } from "../data/stats/gearBaseStats"

export interface GearIdentity {
  level: GearLevel
  rarity: GearRarity
}

export interface InferredGearIdentity {
  level: GearLevel | null
  rarity: GearRarity | null
  candidates: readonly GearIdentity[]
}

const TABLED_LEVELS: readonly GearLevel[] = [91, 96]
const RARITIES: readonly GearRarity[] = ["legendary", "epic"]

function comparedFields(slot: GearSlot): readonly (keyof GearBaseStats)[] {
  return isWeaponSlot(slot) ? ["minPhys", "maxPhys"] : ["hp", "physDef"]
}

export function inferGearIdentity(
  slot: GearSlot,
  observed: Partial<GearBaseStats>,
): InferredGearIdentity {
  const fields = comparedFields(slot).filter((field) => typeof observed[field] === "number")
  if (!fields.length) return { level: null, rarity: null, candidates: [] }

  const candidates: GearIdentity[] = []
  for (const level of TABLED_LEVELS) {
    for (const rarity of RARITIES) {
      const tabled = gearBaseStatsFor({ slot, level, rarity })
      if (fields.every((field) => tabled[field] === observed[field])) {
        candidates.push({ level, rarity })
      }
    }
  }

  const levels = new Set(candidates.map((candidate) => candidate.level))
  const rarities = new Set(candidates.map((candidate) => candidate.rarity))
  return {
    level: levels.size === 1 ? [...levels][0]! : null,
    rarity: rarities.size === 1 ? [...rarities][0]! : null,
    candidates,
  }
}
