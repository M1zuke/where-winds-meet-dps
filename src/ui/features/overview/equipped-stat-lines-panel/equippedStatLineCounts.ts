import { equippedPiecesFor } from "../../../../engine/derivedInputs"
import { followedGraduationBuild } from "../../../../engine/graduation"
import { GEAR_SLOTS } from "../../../../engine/types"
import type { GearPiece, Inputs } from "../../../../engine/types"
import { STAT_LINES, isGearWordId, isUnknownGearWord } from "../../../../data/stats/statLines"

export interface EquippedStatLineRow {
  statLineId: string
  current: number
  wanted: number
}

export interface EquippedStatLineCounts {
  rows: EquippedStatLineRow[]
  currentTotal: number
  wantedTotal: number | null
}

function countWords(pieces: readonly GearPiece[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const piece of pieces) {
    for (const entry of piece.words) {
      if (entry.word === "" || isUnknownGearWord(entry.word) || !isGearWordId(entry.word)) continue
      counts.set(entry.word, (counts.get(entry.word) ?? 0) + 1)
    }
  }
  return counts
}

function sumCounts(counts: ReadonlyMap<string, number>): number {
  let total = 0
  for (const count of counts.values()) total += count
  return total
}

export function equippedStatLineCounts(inputs: Inputs): EquippedStatLineCounts {
  const current = countWords(equippedPiecesFor(inputs))
  const build = followedGraduationBuild(inputs)
  const wanted = build
    ? countWords(build.gear.filter((piece) => GEAR_SLOTS.includes(piece.slot)))
    : new Map<string, number>()
  const rows: EquippedStatLineRow[] = []
  for (const line of STAT_LINES) {
    const currentCount = current.get(line.id) ?? 0
    const wantedCount = wanted.get(line.id) ?? 0
    if (currentCount > 0 || wantedCount > 0) {
      rows.push({ statLineId: line.id, current: currentCount, wanted: wantedCount })
    }
  }
  const lineOrder = new Map<string, number>(STAT_LINES.map((line, index) => [line.id, index]))
  rows.sort(
    (left, right) =>
      right.current - left.current ||
      right.wanted - left.wanted ||
      (lineOrder.get(left.statLineId) ?? 0) - (lineOrder.get(right.statLineId) ?? 0),
  )
  return {
    rows,
    currentTotal: sumCounts(current),
    wantedTotal: build ? sumCounts(wanted) : null,
  }
}
