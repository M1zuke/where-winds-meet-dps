import type { GearPiece, GearWordId } from "./types"
import type { RetunementPool } from "../definitions/classes/classDef"

export const FIRST_LOCKED_SLOT = 0
export const ALL_REROLLABLE_SLOTS: readonly number[] = [1, 2, 3, 4]

export function rerollableSlots(piece: GearPiece): readonly number[] {
  const rerolled = ALL_REROLLABLE_SLOTS.filter((i) => piece.words[i]?.retuned)
  return rerolled.length > 0 ? rerolled : ALL_REROLLABLE_SLOTS
}

export interface FilteredPool {
  slotIndex: number
  candidates: readonly GearWordId[]
  poolSize: number
}

export interface CandidateLegality {
  word: GearWordId
  legal: boolean
  isCurrent: boolean
}

function countOthers(piece: GearPiece, exceptSlot: number): Map<GearWordId, number> {
  const counts = new Map<GearWordId, number>()
  piece.words.forEach((w, i) => {
    if (i === exceptSlot) return
    if (!w.word) return
    counts.set(w.word, (counts.get(w.word) ?? 0) + 1)
  })
  return counts
}

function maxAllowedFor(stat: GearWordId, firstStat: GearWordId | ""): number {
  return stat === firstStat ? 1 : 0
}

export function filterPoolForSlot(
  piece: GearPiece,
  slotIndex: number,
  pool: RetunementPool,
): FilteredPool {
  const firstStat = piece.words[FIRST_LOCKED_SLOT].word
  const others = countOthers(piece, slotIndex)
  const candidates: GearWordId[] = []
  for (const stat of pool.stats) {
    const have = others.get(stat) ?? 0
    if (have <= maxAllowedFor(stat, firstStat)) candidates.push(stat)
  }
  return { slotIndex, candidates, poolSize: pool.stats.length }
}

export function annotatePoolForSlot(
  piece: GearPiece,
  slotIndex: number,
  pool: RetunementPool,
): readonly CandidateLegality[] {
  const firstStat = piece.words[FIRST_LOCKED_SLOT].word
  const others = countOthers(piece, slotIndex)
  const currentWord = piece.words[slotIndex]?.word ?? ""
  return pool.stats.map((word) => {
    const have = others.get(word) ?? 0
    return {
      word,
      legal: have <= maxAllowedFor(word, firstStat),
      isCurrent: word === currentWord,
    }
  })
}
