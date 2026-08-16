export const PARSE_RANKS = [100, 99, 95, 80, 50, 20, 5, 1, 0] as const
export const MEDIAN_RANK = 50

export interface ParseLadderRow {
  rank: number
  totalDamage: number
  deltaFromMedian: number
}

export function parseAtRank(sortedTotals: readonly number[], rank: number): number {
  if (sortedTotals.length === 0) return 0
  const index = Math.ceil((rank / 100) * sortedTotals.length) - 1
  return sortedTotals[Math.min(sortedTotals.length - 1, Math.max(0, index))]
}

export function parseLadder(sortedTotals: readonly number[]): ParseLadderRow[] {
  if (sortedTotals.length === 0) return []
  const median = parseAtRank(sortedTotals, MEDIAN_RANK)
  return PARSE_RANKS.map((rank) => {
    const totalDamage = parseAtRank(sortedTotals, rank)
    return {
      rank,
      totalDamage,
      deltaFromMedian: median > 0 ? (totalDamage - median) / median : 0,
    }
  })
}

export function ladderAxisSpan(rows: readonly ParseLadderRow[]): number {
  let span = 0
  for (const row of rows) span = Math.max(span, Math.abs(row.deltaFromMedian))
  return span
}
