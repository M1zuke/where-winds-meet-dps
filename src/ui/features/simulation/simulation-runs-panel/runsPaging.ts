import type { ParseRun } from "../../../../engine/dpsWorker"

export const RUNS_PER_PAGE = 50

export type RunSortColumn = "run" | "dps" | "damage"

export type PageSlot = number | "gap"

export interface RankedRun {
  run: ParseRun
  rank: number
}

export function rankedRuns(sortedByDamageAscending: readonly ParseRun[]): RankedRun[] {
  const rows: RankedRun[] = []
  for (let position = sortedByDamageAscending.length - 1; position >= 0; position--) {
    rows.push({
      run: sortedByDamageAscending[position],
      rank: sortedByDamageAscending.length - position,
    })
  }
  return rows
}

const VALUE_OF: Record<RunSortColumn, (row: RankedRun) => number> = {
  run: (row) => row.run.index,
  dps: (row) => row.run.dps,
  damage: (row) => row.run.totalDamage,
}

export function sortRankedRuns(
  rows: readonly RankedRun[],
  column: RunSortColumn,
  descending: boolean,
): RankedRun[] {
  const valueOf = VALUE_OF[column]
  const direction = descending ? -1 : 1
  return [...rows].sort((left, right) => (valueOf(left) - valueOf(right)) * direction)
}

export function pageCount(rowCount: number): number {
  return Math.max(1, Math.ceil(rowCount / RUNS_PER_PAGE))
}

export function clampPage(page: number, rowCount: number): number {
  return Math.min(pageCount(rowCount), Math.max(1, Math.round(page)))
}

export function pageRows(rows: readonly RankedRun[], page: number): RankedRun[] {
  const from = (clampPage(page, rows.length) - 1) * RUNS_PER_PAGE
  return rows.slice(from, from + RUNS_PER_PAGE)
}

export function firstRowOnPage(page: number, rowCount: number): number {
  if (rowCount === 0) return 0
  return (clampPage(page, rowCount) - 1) * RUNS_PER_PAGE + 1
}

export function lastRowOnPage(page: number, rowCount: number): number {
  return Math.min(rowCount, clampPage(page, rowCount) * RUNS_PER_PAGE)
}

export function pageOfRow(position: number): number {
  return Math.floor(position / RUNS_PER_PAGE) + 1
}

export function pageNumbers(current: number, total: number): PageSlot[] {
  const shown = new Set<number>([1, total])
  const from = Math.max(1, Math.min(current - 1, total - 3))
  const to = Math.min(total, Math.max(current + 1, 4))
  for (let page = from; page <= to; page++) shown.add(page)

  const slots: PageSlot[] = []
  let previous = 0
  for (const page of [...shown].sort((left, right) => left - right)) {
    if (previous > 0 && page > previous + 1) slots.push("gap")
    slots.push(page)
    previous = page
  }
  return slots
}

export function topPercentOf(rank: number, rowCount: number): number {
  return rowCount > 0 ? (rank / rowCount) * 100 : 0
}
