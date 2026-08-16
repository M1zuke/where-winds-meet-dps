const MIN_BINS = 12
const MAX_BINS = 40

export interface HistogramBin {
  start: number
  end: number
  count: number
}

export interface ParseHistogram {
  bins: HistogramBin[]
  min: number
  max: number
  binWidth: number
  maxCount: number
}

export function binCountFor(runCount: number): number {
  return Math.min(MAX_BINS, Math.max(MIN_BINS, Math.round(Math.sqrt(runCount))))
}

export function parseHistogram(sortedTotals: readonly number[]): ParseHistogram {
  if (sortedTotals.length === 0) {
    return { bins: [], min: 0, max: 0, binWidth: 0, maxCount: 0 }
  }

  const min = sortedTotals[0]
  const max = sortedTotals[sortedTotals.length - 1]
  if (max === min) {
    return {
      bins: [{ start: min, end: min, count: sortedTotals.length }],
      min,
      max,
      binWidth: 0,
      maxCount: sortedTotals.length,
    }
  }

  const binCount = binCountFor(sortedTotals.length)
  const binWidth = (max - min) / binCount
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_unused, index) => ({
    start: min + index * binWidth,
    end: min + (index + 1) * binWidth,
    count: 0,
  }))

  for (const total of sortedTotals) {
    const index = Math.min(binCount - 1, Math.floor((total - min) / binWidth))
    bins[index].count += 1
  }

  let maxCount = 0
  for (const bin of bins) maxCount = Math.max(maxCount, bin.count)
  return { bins, min, max, binWidth, maxCount }
}
