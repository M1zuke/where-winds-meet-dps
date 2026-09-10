import type { GearLevel } from "./types"
import type {
  ReattunementBand,
  ReattunementLine,
  ReattunementPool,
} from "../data/stats/gearReattunementWeights"

const VALUE_STEP = 0.001

export const REATTUNEMENT_PITY_THRESHOLD = 6

// In-game, 2026-09-08: the pity pick-outright unlocks from gear level 91 up
// and does not exist at 86.
export function reattunementPityThreshold(level: GearLevel): number | null {
  return level <= 86 ? null : REATTUNEMENT_PITY_THRESHOLD
}

function lineCap(line: ReattunementLine): number {
  return line.bands[line.bands.length - 1].max
}

export function isReattunementLineAtCap(line: ReattunementLine, value: number): boolean {
  return value >= lineCap(line) - VALUE_STEP / 2
}

function bandIndexFor(bands: readonly ReattunementBand[], value: number): number {
  let matchedIndex = 0
  bands.forEach((band, bandIndex) => {
    if (band.min <= value) matchedIndex = bandIndex
  })
  return matchedIndex
}

function weightedMean(entries: readonly { min: number; max: number; weight: number }[]): number {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0)
  if (totalWeight <= 0) return 0
  return entries.reduce(
    (sum, entry) => sum + (entry.weight / totalWeight) * ((entry.min + entry.max) / 2),
    0,
  )
}

// In-game, 2026-09-08: a line with no improve table still guarantees a higher
// roll by dropping any band entirely below the current value and raising the
// floor of the band straddling it, but keeps every surviving band's original
// weight rather than rescaling it to the narrowed range.
function truncatedFreshValue(bands: readonly ReattunementBand[], currentValue: number): number {
  const survivors = bands
    .filter((band) => band.max > currentValue + VALUE_STEP / 2)
    .map((band) =>
      band.min <= currentValue
        ? { ...band, min: Math.min(currentValue + VALUE_STEP, band.max) }
        : band,
    )
  return weightedMean(survivors)
}

export function expectedFreshValue(line: ReattunementLine): number {
  return weightedMean(line.bands)
}

export function expectedRedeterminedValue(line: ReattunementLine, currentValue: number): number {
  const cap = lineCap(line)
  if (line.improveBands) {
    const index = Math.min(bandIndexFor(line.bands, currentValue), line.improveBands.length - 1)
    const step = line.improveBands[index]
    return Math.min(cap, currentValue + (step.min + step.max) / 2)
  }
  return Math.min(cap, truncatedFreshValue(line.bands, currentValue))
}

export function reattunementExactMaxChance(line: ReattunementLine): number {
  const totalWeight = line.bands.reduce((sum, band) => sum + band.weight, 0)
  if (totalWeight <= 0) return 0
  const topBand = line.bands[line.bands.length - 1]
  const steps = Math.round((topBand.max - topBand.min) / VALUE_STEP) + 1
  return topBand.weight / totalWeight / steps
}

export interface ReattunementDrawable {
  line: ReattunementLine
  pDraw: number
  isCurrentLine: boolean
}

// In-game, 2026-09-08: the draw pops only the currently-held line, and only
// once it is at its own maximum — no other line's history is consulted.
export function reattunementDrawables(
  pool: ReattunementPool,
  currentOptionId: string,
  currentValue: number,
): readonly ReattunementDrawable[] {
  const currentLine = pool.lines.find((line) => line.optionId === currentOptionId)
  const currentAtCap = currentLine ? isReattunementLineAtCap(currentLine, currentValue) : false
  const denominator = pool.totalWeight - (currentAtCap && currentLine ? currentLine.weight : 0)
  if (denominator <= 0) return []
  return pool.lines
    .filter((line) => !(line.optionId === currentOptionId && currentAtCap))
    .map((line) => ({
      line,
      pDraw: line.weight / denominator,
      isCurrentLine: line.optionId === currentOptionId,
    }))
}
