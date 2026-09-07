import type { GearLevel, GearPiece, GearRarity, GearSlot } from "../../engine/types"

export interface GearBaseStats {
  minPhys: number
  maxPhys: number
  hp: number
  physDef: number
}

const GEAR_BASE_STATS: Record<GearLevel, Record<GearSlot, Record<GearRarity, GearBaseStats>>> = {
  86: {
    leftWeapon: {
      epic: { minPhys: 41, maxPhys: 96, hp: 0, physDef: 0 },
      legendary: { minPhys: 46, maxPhys: 106, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 41, maxPhys: 96, hp: 0, physDef: 0 },
      legendary: { minPhys: 46, maxPhys: 106, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 55, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 61, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 82, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 91, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 3506, physDef: 14 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 3896, physDef: 16 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 7012, physDef: 14 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 7791, physDef: 16 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 3506, physDef: 28 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 3896, physDef: 31 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 3506, physDef: 14 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 3896, physDef: 16 },
    },
  },
  91: {
    leftWeapon: {
      epic: { minPhys: 48, maxPhys: 112, hp: 0, physDef: 0 },
      legendary: { minPhys: 53, maxPhys: 124, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 48, maxPhys: 112, hp: 0, physDef: 0 },
      legendary: { minPhys: 53, maxPhys: 124, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 64, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 71, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 96, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 106, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 18 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 8305, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 9227, physDef: 18 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 32 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 36 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 18 },
    },
  },
  96: {
    leftWeapon: {
      epic: { minPhys: 59, maxPhys: 136, hp: 0, physDef: 0 },
      legendary: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 59, maxPhys: 136, hp: 0, physDef: 0 },
      legendary: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 78, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 86, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 116, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 129, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 10392, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 11547, physDef: 22 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 39 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 44 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
    },
  },
  100: {
    leftWeapon: {
      epic: { minPhys: 68, maxPhys: 158, hp: 0, physDef: 0 },
      legendary: { minPhys: 75, maxPhys: 175, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 68, maxPhys: 158, hp: 0, physDef: 0 },
      legendary: { minPhys: 75, maxPhys: 175, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 90, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 100, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 135, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 150, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 6192, physDef: 23 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 6879, physDef: 25 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 12383, physDef: 23 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 13758, physDef: 25 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 6192, physDef: 45 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 6879, physDef: 50 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 6192, physDef: 23 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 6879, physDef: 25 },
    },
  },
  105: {
    leftWeapon: {
      epic: { minPhys: 79, maxPhys: 183, hp: 0, physDef: 0 },
      legendary: { minPhys: 87, maxPhys: 203, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 79, maxPhys: 183, hp: 0, physDef: 0 },
      legendary: { minPhys: 87, maxPhys: 203, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 105, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 116, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 157, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 174, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 7402, physDef: 27 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 8225, physDef: 29 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 14804, physDef: 27 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 16449, physDef: 29 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 7402, physDef: 53 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 8225, physDef: 58 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 7402, physDef: 27 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 8225, physDef: 29 },
    },
  },
}

export function gearBaseStatsFor(
  piece: Pick<GearPiece, "slot" | "rarity" | "level">,
): GearBaseStats {
  return GEAR_BASE_STATS[piece.level][piece.slot][piece.rarity]
}
