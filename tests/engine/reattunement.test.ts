import { describe, expect, it } from "vitest"
import {
  expectedFreshValue,
  expectedRedeterminedValue,
  isReattunementLineAtCap,
  reattunementDrawables,
  reattunementPityThreshold,
} from "../../src/engine/reattunement"
import { reattunementPool } from "../../src/data/stats/gearReattunementWeights"
import type {
  ReattunementLine,
  ReattunementPool,
} from "../../src/data/stats/gearReattunementWeights"

describe("reattunementPityThreshold", () => {
  it("is absent at gear level 86", () => {
    expect(reattunementPityThreshold(86)).toBeNull()
  })

  it("is 6 at every level from 91 up", () => {
    expect(reattunementPityThreshold(91)).toBe(6)
    expect(reattunementPityThreshold(96)).toBe(6)
    expect(reattunementPityThreshold(100)).toBe(6)
    expect(reattunementPityThreshold(105)).toBe(6)
  })
})

describe("isReattunementLineAtCap", () => {
  const line = reattunementPool("bellstrikeUmbra", "leftWeapon", 91)!.lines.find(
    (candidate) => candidate.optionId === "physPen",
  )!

  it("is false below the line's maximum", () => {
    expect(isReattunementLineAtCap(line, 0.06)).toBe(false)
  })

  it("is true at the line's maximum", () => {
    expect(isReattunementLineAtCap(line, 0.09)).toBe(true)
  })
})

describe("expectedRedeterminedValue — the monotone guarantee", () => {
  const line = reattunementPool("bellstrikeUmbra", "leftWeapon", 91)!.lines.find(
    (candidate) => candidate.optionId === "physPen",
  )!

  it("is always strictly higher than the current value, with a banded improve table", () => {
    for (const current of [0.054, 0.06, 0.07, 0.08, 0.089]) {
      expect(expectedRedeterminedValue(line, current)).toBeGreaterThan(current)
    }
  })

  it("never exceeds the line's maximum", () => {
    expect(expectedRedeterminedValue(line, 0.089)).toBeLessThanOrEqual(0.09 + 1e-9)
  })

  it("picks a smaller increment the higher the current value already is", () => {
    const lowIncrement = expectedRedeterminedValue(line, 0.055) - 0.055
    const highIncrement = expectedRedeterminedValue(line, 0.085) - 0.085
    expect(highIncrement).toBeLessThan(lowIncrement)
  })

  it("still guarantees a strictly higher value with no banded improve table (level 86)", () => {
    const level86 = reattunementPool("bellstrikeUmbra", "leftWeapon", 86)!.lines.find(
      (candidate) => candidate.optionId === "physPen",
    )!
    for (const current of [0.05, 0.06, 0.07, 0.077]) {
      expect(expectedRedeterminedValue(level86, current)).toBeGreaterThan(current)
    }
  })
})

describe("expectedFreshValue — a different line's ordinary roll", () => {
  it("lands within the line's own range", () => {
    const line = reattunementPool("bellstrikeUmbra", "leftWeapon", 96)!.lines.find(
      (candidate) => candidate.optionId === "formlessPen",
    )!
    const value = expectedFreshValue(line)
    expect(value).toBeGreaterThanOrEqual(line.bands[0].min)
    expect(value).toBeLessThanOrEqual(line.bands[line.bands.length - 1].max)
  })
})

describe("reattunementDrawables", () => {
  const pool = reattunementPool("bellstrikeUmbra", "leftWeapon", 91)!

  it("sums pDraw to 1 across the survivors when nothing is at cap", () => {
    const drawables = reattunementDrawables(pool, "physPen", 0.06)
    const total = drawables.reduce((sum, drawable) => sum + drawable.pDraw, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it("pops the current line once it is at its cap", () => {
    const line = pool.lines.find((candidate) => candidate.optionId === "physPen")!
    const drawables = reattunementDrawables(pool, "physPen", line.bands[line.bands.length - 1].max)
    expect(drawables.some((drawable) => drawable.line.optionId === "physPen")).toBe(false)
  })

  it("flags exactly the currently-held line as the monotone draw", () => {
    const drawables = reattunementDrawables(pool, "physPen", 0.06)
    const own = drawables.find((drawable) => drawable.line.optionId === "physPen")!
    expect(own.isCurrentLine).toBe(true)
    expect(drawables.filter((drawable) => drawable.isCurrentLine)).toHaveLength(1)
  })

  it("raises every other line's pDraw once the current line pops out of the pool", () => {
    const line = pool.lines.find((candidate) => candidate.optionId === "physPen")!
    const cap = line.bands[line.bands.length - 1].max
    const beforeCap = reattunementDrawables(pool, "physPen", 0.06)
    const atCap = reattunementDrawables(pool, "physPen", cap)
    const otherBefore = beforeCap.find((drawable) => drawable.line.optionId === "physResist")!
    const otherAfter = atCap.find((drawable) => drawable.line.optionId === "physResist")!
    expect(otherAfter.pDraw).toBeGreaterThan(otherBefore.pDraw)
  })
})

describe("reattunementDrawables — a synthetic pool with an unmodelled member", () => {
  const line: ReattunementLine = {
    optionId: "modelled",
    weight: 100,
    bands: [{ min: 0, max: 10, weight: 100 }],
  }
  const pool: ReattunementPool = { totalWeight: 200, lines: [line] }

  it("keeps the unmodelled weight out of the modelled line's denominator only if popped", () => {
    const drawables = reattunementDrawables(pool, "modelled", 5)
    expect(drawables[0]!.pDraw).toBeCloseTo(100 / 200, 6)
  })
})
