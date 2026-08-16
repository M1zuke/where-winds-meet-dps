import { describe, expect, it } from "vitest"
import type { ParseRun } from "../../src/engine/dpsWorker"
import {
  parseSummary,
  sortedTotalDamage,
} from "../../src/ui/features/simulation/simulation-summary-bar/summaryStats"
import {
  ladderAxisSpan,
  parseAtRank,
  parseLadder,
  PARSE_RANKS,
} from "../../src/ui/features/simulation/simulation-parse-ladder-panel/parseLadder"
import {
  binCountFor,
  damageHistogram,
} from "../../src/ui/features/simulation/simulation-distribution-panel/damageHistogram"
import {
  outcomeMix,
  OUTCOME_ORDER,
  totalMeanHits,
} from "../../src/ui/features/simulation/simulation-outcome-mix-panel/outcomeMix"
import {
  clampRunCount,
  MAX_RUN_COUNT,
  MIN_RUN_COUNT,
} from "../../src/ui/features/simulation/simulationRunSettings"

function run(
  totalDamage: number,
  hits = { abrasion: 1, normal: 5, crit: 3, affinity: 1 },
): ParseRun {
  return {
    totalDamage,
    dps: totalDamage / 60,
    abrasionHits: hits.abrasion,
    normalHits: hits.normal,
    criticalHits: hits.crit,
    affinityHits: hits.affinity,
  }
}

const spread = [100, 120, 90, 110, 130, 80, 105, 95, 115, 125].map((total) => run(total))

describe("parseSummary", () => {
  it("averages the total damage and every hit category over the runs", () => {
    const summary = parseSummary([
      run(100, { abrasion: 2, normal: 4, crit: 6, affinity: 0 }),
      run(200, { abrasion: 0, normal: 6, crit: 4, affinity: 2 }),
    ])!
    expect(summary.meanTotalDamage).toBe(150)
    expect(summary.meanAbrasionHits).toBe(1)
    expect(summary.meanNormalHits).toBe(5)
    expect(summary.meanCriticalHits).toBe(5)
    expect(summary.meanAffinityHits).toBe(1)
  })

  it("reports the best and worst parse as the highest and lowest observed totals", () => {
    const summary = parseSummary(spread)!
    expect(summary.bestTotalDamage).toBe(130)
    expect(summary.worstTotalDamage).toBe(80)
  })

  it("states the range as best minus worst over the mean, in percent", () => {
    const summary = parseSummary([run(90), run(110)])!
    expect(summary.rangeFraction).toBeCloseTo(0.2, 10)
  })

  it("reports no summary at all when no run finished", () => {
    expect(parseSummary([])).toBeNull()
  })

  it("keeps the range at zero when every parse dealt the same damage", () => {
    expect(parseSummary([run(100), run(100)])!.rangeFraction).toBe(0)
  })

  it("sorts the totals ascending without touching the runs", () => {
    const sorted = sortedTotalDamage(spread)
    expect(sorted[0]).toBe(80)
    expect(sorted[sorted.length - 1]).toBe(130)
    expect(spread[0].totalDamage).toBe(100)
  })
})

describe("parseLadder", () => {
  const sorted = sortedTotalDamage(spread)

  it("ranks max and min as the best and worst observed parse", () => {
    expect(parseAtRank(sorted, 100)).toBe(130)
    expect(parseAtRank(sorted, 0)).toBe(80)
  })

  it("never invents a damage value between two observed runs", () => {
    const observed = new Set(sorted)
    for (const row of parseLadder(sorted)) expect(observed.has(row.totalDamage)).toBe(true)
  })

  it("places a top-99 parse above ninety-nine percent of the runs", () => {
    const many = sortedTotalDamage(Array.from({ length: 1000 }, (_unused, index) => run(index + 1)))
    const value = parseAtRank(many, 99)
    const beaten = many.filter((total) => total < value).length
    expect(beaten / many.length).toBeGreaterThanOrEqual(0.98)
    expect(value).toBe(990)
  })

  it("reports every rank as its own deviation from the median", () => {
    const rows = parseLadder(sorted)
    const median = parseAtRank(sorted, 50)
    for (const row of rows) {
      expect(row.deltaFromMedian).toBeCloseTo((row.totalDamage - median) / median, 10)
    }
    expect(rows.find((row) => row.rank === 50)!.deltaFromMedian).toBe(0)
  })

  it("repeats one value across every rank when all runs are identical", () => {
    const flat = sortedTotalDamage([run(500), run(500), run(500)])
    const rows = parseLadder(flat)
    expect(rows).toHaveLength(PARSE_RANKS.length)
    expect(rows.every((row) => row.totalDamage === 500)).toBe(true)
    expect(ladderAxisSpan(rows)).toBe(0)
  })

  it("has no rows without runs", () => {
    expect(parseLadder([])).toEqual([])
  })
})

describe("damageHistogram", () => {
  const sorted = sortedTotalDamage(spread)

  it("spans the bins from the worst parse to the best", () => {
    const histogram = damageHistogram(sorted)
    expect(histogram.bins[0].start).toBe(80)
    expect(histogram.bins[histogram.bins.length - 1].end).toBeCloseTo(130, 10)
  })

  it("counts every run into exactly one bin", () => {
    const histogram = damageHistogram(sorted)
    const counted = histogram.bins.reduce((sum, bin) => sum + bin.count, 0)
    expect(counted).toBe(sorted.length)
  })

  it("puts the best parse in the last bin rather than past the end", () => {
    const histogram = damageHistogram(sorted)
    expect(histogram.bins[histogram.bins.length - 1].count).toBeGreaterThan(0)
  })

  it("falls back to a single bin when every parse is identical", () => {
    const histogram = damageHistogram([42, 42, 42])
    expect(histogram.bins).toHaveLength(1)
    expect(histogram.bins[0].count).toBe(3)
    expect(histogram.binWidth).toBe(0)
  })

  it("narrows the bin count for a short run", () => {
    expect(binCountFor(50)).toBeLessThan(binCountFor(1000))
    expect(binCountFor(4)).toBe(12)
    expect(binCountFor(100000)).toBe(40)
  })
})

describe("outcomeMix", () => {
  const summary = parseSummary([run(100, { abrasion: 1, normal: 5, crit: 3, affinity: 1 })])!

  it("shares the four outcomes over the total hits of an average parse", () => {
    const rows = outcomeMix(summary, null)
    expect(totalMeanHits(summary)).toBe(10)
    expect(rows.find((row) => row.category === "critical")!.observedShare).toBeCloseTo(0.3, 10)
    expect(rows.reduce((sum, row) => sum + row.observedShare, 0)).toBeCloseTo(1, 10)
  })

  it("keeps the category order fixed regardless of which outcome dominates", () => {
    const dominated = parseSummary([run(100, { abrasion: 90, normal: 1, crit: 1, affinity: 1 })])!
    expect(outcomeMix(dominated, null).map((row) => row.category)).toEqual([...OUTCOME_ORDER])
  })

  it("reports no expected rate when the engine supplied none", () => {
    for (const row of outcomeMix(summary, null)) {
      expect(row.expectedShare).toBeNull()
      expect(row.deltaPoints).toBeNull()
    }
  })

  it("states the gap to the expected rate in percentage points", () => {
    const rows = outcomeMix(summary, { abrasion: 0.1, normal: 0.5, crit: 0.25, affinity: 0.15 })
    expect(rows.find((row) => row.category === "critical")!.deltaPoints).toBeCloseTo(5, 10)
    expect(rows.find((row) => row.category === "abrasion")!.deltaPoints).toBeCloseTo(0, 10)
  })
})

describe("clampRunCount", () => {
  it("holds a run count inside the range the worker will honour", () => {
    expect(clampRunCount(MAX_RUN_COUNT + 1)).toBe(MAX_RUN_COUNT)
    expect(clampRunCount(1)).toBe(MIN_RUN_COUNT)
    expect(clampRunCount(2500)).toBe(2500)
  })

  it("falls back to the default when the field holds no number", () => {
    expect(clampRunCount(Number.NaN)).toBe(1000)
  })
})
