import type { GearLevel, GearPiece, GearRarity, GearSlot } from "../../engine/types"

export interface GearBaseStats {
  minPhys: number
  maxPhys: number
  hp: number
  physDef: number
}

const GEAR_BASE_STATS: Partial<
  Record<GearLevel, Record<GearSlot, Record<GearRarity, GearBaseStats>>>
> = {
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
}

const ZERO_BASE: GearBaseStats = { minPhys: 0, maxPhys: 0, hp: 0, physDef: 0 }

export function gearBaseStatsFor(
  piece: Pick<GearPiece, "slot" | "rarity" | "level">,
): GearBaseStats {
  const byLevel = GEAR_BASE_STATS[piece.level] ?? GEAR_BASE_STATS[91]!
  return byLevel[piece.slot]?.[piece.rarity] ?? ZERO_BASE
}
