import type { ParseRun } from "../../../../engine/dpsWorker"

export const PARSE_RANKS = [100, 99, 95, 80, 50, 20, 5, 1, 0] as const
export const MEDIAN_RANK = 50

export interface ParseLadderRow {
  rank: number
  dps: number
  totalDamage: number
  deltaFromMedian: number
}

export function parseAtRank(sorted: readonly ParseRun[], rank: number): ParseRun | null {
  if (sorted.length === 0) return null
  const index = Math.ceil((rank / 100) * sorted.length) - 1
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))]
}

export function parseLadder(sorted: readonly ParseRun[]): ParseLadderRow[] {
  const median = parseAtRank(sorted, MEDIAN_RANK)
  if (!median) return []
  return PARSE_RANKS.map((rank) => {
    const run = parseAtRank(sorted, rank)!
    return {
      rank,
      dps: run.dps,
      totalDamage: run.totalDamage,
      deltaFromMedian: median.dps > 0 ? (run.dps - median.dps) / median.dps : 0,
    }
  })
}

export function ladderAxisSpan(rows: readonly ParseLadderRow[]): number {
  let span = 0
  for (const row of rows) span = Math.max(span, Math.abs(row.deltaFromMedian))
  return span
}
