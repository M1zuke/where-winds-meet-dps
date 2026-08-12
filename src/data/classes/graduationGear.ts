import type { GearPiece, GearSlot, GearWordName } from "../../engine/types"
import type { AttunementId } from "../../engine/attunements"

export interface GraduationWordRoll {
  word: GearWordName
  value: number
}

export type GraduationWordRolls = readonly [
  GraduationWordRoll,
  GraduationWordRoll,
  GraduationWordRoll,
  GraduationWordRoll,
  GraduationWordRoll,
]

interface GraduationGearPieceOptions {
  idPrefix: string
  slot: GearSlot
  words: GraduationWordRolls
  attunement: AttunementId
  attunementValue: number
}

const SLOT_STATS: Readonly<
  Record<GearSlot, Pick<GearPiece, "minPhys" | "maxPhys" | "hp" | "physDef">>
> = {
  leftWeapon: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
  rightWeapon: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
  disc: { minPhys: 86, maxPhys: 0, hp: 0, physDef: 0 },
  pendant: { minPhys: 0, maxPhys: 129, hp: 0, physDef: 0 },
  helm: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
  armor: { minPhys: 0, maxPhys: 0, hp: 11547, physDef: 22 },
  greaves: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 44 },
  bracer: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
}

export function createGraduationGearPiece(options: GraduationGearPieceOptions): GearPiece {
  return {
    id: `${options.idPrefix}-${options.slot}`,
    slot: options.slot,
    level: 96,
    rarity: "legendary",
    ...SLOT_STATS[options.slot],
    words: options.words.map(({ word, value }) => ({
      word,
      value,
      retuned: false,
    })) as GearPiece["words"],
    attunement: options.attunement,
    attunementValue: options.attunementValue,
    relayed: false,
  }
}
