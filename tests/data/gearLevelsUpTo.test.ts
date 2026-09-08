import { describe, expect, it } from "vitest"
import { gearLevelsUpTo } from "../../src/definitions/baseStats/breakthroughs"
import { GEAR_LEVELS } from "../../src/engine/types"

describe("gearLevelsUpTo", () => {
  it("offers no gear level the breakthrough has not reached", () => {
    expect(gearLevelsUpTo(17)).toEqual([86, 91, 96])
    expect(gearLevelsUpTo(18)).toEqual([86, 91, 96, 100])
    expect(gearLevelsUpTo(20)).toEqual([86, 91, 96, 100, 105])
  })

  it("opens a level on the breakthrough that introduces it, not the one after", () => {
    expect(gearLevelsUpTo(15)).not.toContain(96)
    expect(gearLevelsUpTo(16)).toContain(96)
    expect(gearLevelsUpTo(19)).not.toContain(105)
  })

  it("never returns a level outside the modelled set, and never returns nothing", () => {
    for (let breakthrough = 1; breakthrough <= 25; breakthrough++) {
      const levels = gearLevelsUpTo(breakthrough)
      expect(levels.length).toBeGreaterThan(0)
      for (const level of levels) expect(GEAR_LEVELS).toContain(level)
    }
  })

  it("grows monotonically with the breakthrough", () => {
    for (let breakthrough = 12; breakthrough < 21; breakthrough++) {
      const earlier = gearLevelsUpTo(breakthrough)
      const later = gearLevelsUpTo(breakthrough + 1)
      expect(later.length).toBeGreaterThanOrEqual(earlier.length)
      for (const level of earlier) expect(later).toContain(level)
    }
  })
})
