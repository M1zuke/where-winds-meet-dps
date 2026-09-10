import { describe, expect, it } from "vitest"
import type { ParseRun } from "../../src/engine/dpsWorker"
import {
  clampPage,
  firstRowOnPage,
  lastRowOnPage,
  pageCount,
  pageNumbers,
  pageOfRow,
  pageRows,
  rankedRuns,
  RUNS_PER_PAGE,
  sortRankedRuns,
  topPercentOf,
} from "../../src/ui/features/simulation/simulation-runs-panel/runsPaging"

function run(index: number, totalDamage: number): ParseRun {
  return {
    index,
    totalDamage,
    dps: totalDamage / 60,
    abrasionHits: 1,
    normalHits: 5,
    criticalHits: 3,
    affinityHits: 1,
    abrasionDamage: totalDamage * 0.02,
    normalDamage: totalDamage * 0.28,
    criticalDamage: totalDamage * 0.4,
    affinityDamage: totalDamage * 0.3,
  }
}

function ascendingRuns(totals: number[]): ParseRun[] {
  return totals
    .map((totalDamage, index) => run(index, totalDamage))
    .sort((left, right) => left.totalDamage - right.totalDamage)
}

const spread = ascendingRuns([100, 130, 90, 120, 110])

describe("rankedRuns", () => {
  it("ranks the best parse first and keeps every run's own number", () => {
    const rows = rankedRuns(spread)

    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5])
    expect(rows.map((row) => row.run.index)).toEqual([1, 3, 4, 0, 2])
    expect(rows[0].run.totalDamage).toBe(130)
  })

  it("leaves the rank alone when the rows are sorted by something else", () => {
    const byRunNumber = sortRankedRuns(rankedRuns(spread), "run", false)

    expect(byRunNumber.map((row) => row.run.index)).toEqual([0, 1, 2, 3, 4])
    expect(byRunNumber.map((row) => row.rank)).toEqual([4, 1, 5, 2, 3])
  })
})

describe("sortRankedRuns", () => {
  it("sorts by damage in both directions", () => {
    const rows = rankedRuns(spread)

    expect(sortRankedRuns(rows, "damage", true).map((row) => row.run.totalDamage)).toEqual([
      130, 120, 110, 100, 90,
    ])
    expect(sortRankedRuns(rows, "damage", false).map((row) => row.run.totalDamage)).toEqual([
      90, 100, 110, 120, 130,
    ])
  })

  it("does not reorder the rows it was given", () => {
    const rows = rankedRuns(spread)

    sortRankedRuns(rows, "run", false)

    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5])
  })
})

describe("paging", () => {
  const rows = rankedRuns(ascendingRuns(Array.from({ length: 120 }, (_unused, index) => index)))

  it("cuts the rows into pages of fifty", () => {
    expect(RUNS_PER_PAGE).toBe(50)
    expect(pageCount(rows.length)).toBe(3)
    expect(pageRows(rows, 1)).toHaveLength(50)
    expect(pageRows(rows, 3)).toHaveLength(20)
    expect(pageRows(rows, 2)[0]).toBe(rows[50])
  })

  it("holds a page number inside the pages that exist", () => {
    expect(clampPage(0, rows.length)).toBe(1)
    expect(clampPage(99, rows.length)).toBe(3)
    expect(clampPage(1, 0)).toBe(1)
  })

  it("counts the rows the current page covers", () => {
    expect(firstRowOnPage(2, rows.length)).toBe(51)
    expect(lastRowOnPage(2, rows.length)).toBe(100)
    expect(lastRowOnPage(3, rows.length)).toBe(120)
    expect(firstRowOnPage(1, 0)).toBe(0)
  })

  it("finds the page a row sits on", () => {
    expect(pageOfRow(0)).toBe(1)
    expect(pageOfRow(49)).toBe(1)
    expect(pageOfRow(50)).toBe(2)
  })
})

describe("pageNumbers", () => {
  it("keeps the first and last page reachable from anywhere", () => {
    expect(pageNumbers(1, 200)).toEqual([1, 2, 3, 4, "gap", 200])
    expect(pageNumbers(100, 200)).toEqual([1, "gap", 99, 100, 101, "gap", 200])
    expect(pageNumbers(200, 200)).toEqual([1, "gap", 197, 198, 199, 200])
  })

  it("shows every page while they still fit", () => {
    expect(pageNumbers(1, 1)).toEqual([1])
    expect(pageNumbers(2, 3)).toEqual([1, 2, 3])
  })
})

describe("topPercentOf", () => {
  it("reads a rank as the share of runs it beat", () => {
    expect(topPercentOf(6, 10_000)).toBeCloseTo(0.06, 10)
    expect(topPercentOf(1, 100)).toBeCloseTo(1, 10)
    expect(topPercentOf(1, 0)).toBe(0)
  })
})
