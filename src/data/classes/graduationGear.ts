import type { GearPiece, GearSlot, GearWordId } from "../../engine/types"
import type { AttunementId } from "../../engine/attunements"
import { getAttunement } from "../../engine/attunements"
import { relayedCapValue } from "../../engine/gearStats"
import { gearBaseStatsFor } from "../stats/gearBaseStats"
import { GEAR_WORD_MAX_ROLL, GEAR_WORD_UNIT } from "../stats/statLines"

export type GraduationWords = readonly [GearWordId, GearWordId, GearWordId, GearWordId, GearWordId]

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

export function relayGraduationGearPiece(piece: GearPiece): GearPiece {
  return {
    ...piece,
    words: piece.words.map((entry) =>
      entry.word
        ? {
            ...entry,
            value: relayedCapValue(GEAR_WORD_MAX_ROLL[entry.word], GEAR_WORD_UNIT[entry.word]),
          }
        : entry,
    ) as GearPiece["words"],
    relayed: true,
  }
}
