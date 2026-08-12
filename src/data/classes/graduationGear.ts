import type { GearPiece, GearSlot, GearWordName } from "../../engine/types"
import type { AttunementId } from "../../engine/attunements"
import { getAttunement } from "../../engine/attunements"
import { gearBaseStatsFor } from "../stats/gearBaseStats"
import { GEAR_WORD_MAX_ROLL } from "../stats/gearWordRolls"

export type GraduationWords = readonly [
  GearWordName,
  GearWordName,
  GearWordName,
  GearWordName,
  GearWordName,
]

interface GraduationGearPieceOptions {
  idPrefix: string
  slot: GearSlot
  words: GraduationWords
  attunement: AttunementId
}

const GRADUATION_LEVEL = 96
const GRADUATION_RARITY = "legendary"

export function createGraduationGearPiece(options: GraduationGearPieceOptions): GearPiece {
  return {
    id: `${options.idPrefix}-${options.slot}`,
    slot: options.slot,
    level: GRADUATION_LEVEL,
    rarity: GRADUATION_RARITY,
    ...gearBaseStatsFor({
      slot: options.slot,
      level: GRADUATION_LEVEL,
      rarity: GRADUATION_RARITY,
    }),
    words: options.words.map((word) => ({
      word,
      value: GEAR_WORD_MAX_ROLL[word],
      retuned: false,
    })) as GearPiece["words"],
    attunement: options.attunement,
    attunementValue: getAttunement(options.attunement)?.max ?? 0,
    relayed: false,
  }
}
