import type { GearLevel, GearPiece, GearSlot, GearWordId } from "../../engine/types"
import type { AttunementId } from "../../engine/attunements"
import { attunementMax, getAttunement } from "../../engine/attunements"
import { relayedCapValue } from "../../engine/gearStats"
import { gearBaseStatsFor } from "../stats/gearBaseStats"
import { GEAR_WORD_UNIT, gearWordMaxRoll } from "../stats/statLines"

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
  const attunement = getAttunement(options.attunement)
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
      value: gearWordMaxRoll(word, GRADUATION_LEVEL),
      retuned: false,
    })) as GearPiece["words"],
    attunement: options.attunement,
    attunementValue: attunement ? attunementMax(attunement, GRADUATION_LEVEL) : 0,
    relayed: false,
  }
}

// Keeps the word and attunement ids the class definition authored, and only
// re-levels the base stats and their ceilings.
export function gearPieceAtGearLevel(piece: GearPiece, level: GearLevel): GearPiece {
  const attunement = getAttunement(piece.attunement)
  return {
    ...piece,
    level,
    ...gearBaseStatsFor({ slot: piece.slot, rarity: piece.rarity, level }),
    words: piece.words.map((entry) =>
      entry.word ? { ...entry, value: gearWordMaxRoll(entry.word, level) } : entry,
    ) as GearPiece["words"],
    attunementValue: attunement ? attunementMax(attunement, level) : 0,
  }
}

export function relayGraduationGearPiece(piece: GearPiece, level: GearLevel): GearPiece {
  const atLevel = gearPieceAtGearLevel(piece, level)
  return {
    ...atLevel,
    words: atLevel.words.map((entry) =>
      entry.word
        ? { ...entry, value: relayedCapValue(entry.value, GEAR_WORD_UNIT[entry.word]) }
        : entry,
    ) as GearPiece["words"],
    relayed: true,
  }
}
