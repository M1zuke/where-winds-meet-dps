import type { GearLevel, GearPiece, GearRarity, GearWordId } from "./types"
import type { RetunementPool } from "../definitions/classes/classDef"
import type { RetuneBand, RetuneLine } from "../data/stats/gearRetuneWeights"
import type { StatLineUnit } from "../data/stats/statLines"

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

// The first line is fixed in-game: it never retunes, and a draw may duplicate it
// onto one of the other four — so only those four narrow the draw, identically
// whichever one of them is being retuned.
function wordsOnRerollableLines(piece: GearPiece): ReadonlySet<GearWordId> {
  return new Set(
    ALL_REROLLABLE_SLOTS.map((slotIndex) => piece.words[slotIndex]?.word).filter(
      (word): word is GearWordId => word !== undefined && word !== "",
    ),
  )
}

export function retunedOutWordsOf(piece: GearPiece): ReadonlySet<GearWordId> {
  return new Set(piece.retunedOutWords ?? [])
}

export interface RetuneChoice {
  word: GearWordId
  min: number
  max: number
  pDraw: number
  deselected: boolean
  onRerollableLine: boolean
}

export function retunePoolChoices(
  piece: GearPiece,
  pool: readonly RetuneLine[],
): readonly RetuneChoice[] {
  const takenWords = wordsOnRerollableLines(piece)
  const deselected = retunedOutWordsOf(piece)
  const drawable = pool.filter((line) => !takenWords.has(line.word) && !deselected.has(line.word))
  const totalWeight = drawable.reduce((sum, line) => sum + line.weight, 0)
  return pool.map((line) => {
    const out = takenWords.has(line.word) || deselected.has(line.word)
    return {
      word: line.word,
      min: line.bands[0].min,
      max: line.bands[2].max,
      pDraw: !out && totalWeight > 0 ? line.weight / totalWeight : 0,
      deselected: deselected.has(line.word),
      onRerollableLine: takenWords.has(line.word),
    }
  })
}

export type RetuneAttemptBudget = "single" | "repeatable"

// Gear level 86 grants exactly one retune ever; every level from 91 up is
// repeatable (subject to an in-game cooldown this app does not model).
export function retuneAttemptBudget(level: GearLevel): RetuneAttemptBudget {
  return level <= 86 ? "single" : "repeatable"
}

function bandStarWeight(band: RetuneBand, rarity: GearRarity): number {
  return rarity === "legendary" ? band.star5Weight : band.lowerStarWeight
}

const RAW_VALUE_STEP = 0.1
const PERCENT_VALUE_STEP = 0.001

export function exactMaxWithinLineChance(
  line: RetuneLine,
  rarity: GearRarity,
  unit: StatLineUnit,
): number {
  const totalWeight = line.bands.reduce((sum, band) => sum + bandStarWeight(band, rarity), 0)
  if (totalWeight <= 0) return 0
  const topBand = line.bands[2]
  const step = unit === "percent" ? PERCENT_VALUE_STEP : RAW_VALUE_STEP
  const steps = Math.round((topBand.max - topBand.min) / step) + 1
  return bandStarWeight(topBand, rarity) / totalWeight / steps
}

// Assumes ΔDPS is linear in the rolled value between `min` and `max` — the
// same assumption `probLinearImprove` makes for re-attunement's single range,
// applied per band here.
export function probLinearImprove(
  dpsMin: number,
  dpsMax: number,
  baseline: number,
  min: number,
  max: number,
): number {
  if (max <= min || Math.abs(dpsMax - dpsMin) < 1e-9) {
    return dpsMax > baseline + 1e-9 ? 1 : 0
  }
  if (dpsMax > dpsMin) {
    if (dpsMin >= baseline) return 1
    if (dpsMax <= baseline) return 0
    const vCrit = min + ((baseline - dpsMin) * (max - min)) / (dpsMax - dpsMin)
    return Math.max(0, Math.min(1, (max - vCrit) / (max - min)))
  }
  if (dpsMax >= baseline) return 1
  if (dpsMin <= baseline) return 0
  const vCrit = min + ((baseline - dpsMin) * (max - min)) / (dpsMax - dpsMin)
  return Math.max(0, Math.min(1, (vCrit - min) / (max - min)))
}

export interface RetuneLineOutcome {
  pImprove: number
  eDeltaDpsGivenDrawn: number
}

export function retuneLineOutcome(
  line: RetuneLine,
  rarity: GearRarity,
  baseline: number,
  dpsAt: (value: number) => number,
): RetuneLineOutcome {
  const totalWeight = line.bands.reduce((sum, band) => sum + bandStarWeight(band, rarity), 0)
  if (totalWeight <= 0) return { pImprove: 0, eDeltaDpsGivenDrawn: 0 }

  let pImprove = 0
  let eDeltaDpsGivenDrawn = 0
  for (const band of line.bands) {
    const bandWeight = bandStarWeight(band, rarity)
    if (bandWeight <= 0) continue
    const share = bandWeight / totalWeight
    const dpsAtMin = dpsAt(band.min)
    const dpsAtMax = dpsAt(band.max)
    pImprove += share * probLinearImprove(dpsAtMin, dpsAtMax, baseline, band.min, band.max)
    eDeltaDpsGivenDrawn += share * ((dpsAtMin + dpsAtMax) / 2 - baseline)
  }
  return { pImprove, eDeltaDpsGivenDrawn }
}
