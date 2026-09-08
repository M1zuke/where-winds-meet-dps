import { describe, expect, it } from "vitest"
import {
  arsenalHp,
  deriveStats,
  getSchool,
  getBreakthrough,
  penResistanceForBreakthrough,
  penResistanceForInputs,
} from "../../src/engine/panel"
import {
  arsenalScoreCap,
  arsenalStoreHp,
  arsenalStoreState,
  defaultArsenalScores,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"

describe("panel.deriveStats", () => {
  it("resolves the class & target metadata", () => {
    const d = deriveStats(defaultInputs)
    expect(d.classId).toBe("bellstrikeUmbra")
    expect(d.primaryAttribute).toBe("Bellstrike")
    expect(d.defense).toBe(308)
  })

  it("computes effective defense via penetration", () => {
    const d = deriveStats(defaultInputs)
    expect(d.effectiveDefense).toBeCloseTo(308 * (1 - 0.292), 6)
  })

  it("maps weapon boosts by name", () => {
    const d = deriveStats({ ...defaultInputs, dualKnivesBoost: 0.05 })
    expect(d.weaponBoosts["Twin Blades"]).toBe(0.05)
    expect(d.weaponBoosts["Sword"]).toBe(0)
  })
})

describe("getSchool / getBreakthrough", () => {
  it("knows the one implemented class", () => {
    expect(getSchool("bellstrikeUmbra").id).toBe("bellstrikeUmbra")
  })

  it("knows the locked-fixture breakthrough", () => {
    expect(getBreakthrough(13).defense).toBe(308)
  })

  it("jumps target defense at breakthrough 18/19", () => {
    expect(getBreakthrough(18).defense).toBe(500)
    expect(getBreakthrough(19).defense).toBe(500)
  })

  it("jumps target defense again at breakthrough 20/21", () => {
    expect(getBreakthrough(20).defense).toBe(558)
    expect(getBreakthrough(21).defense).toBe(558)
  })
})

describe("penResistanceForBreakthrough", () => {
  it("is zero through breakthrough 19", () => {
    for (const breakthrough of [13, 14, 15, 16, 17, 18, 19]) {
      expect(penResistanceForBreakthrough(breakthrough)).toEqual({ physical: 0, attribute: 0 })
    }
  })

  it("is non-zero from breakthrough 20, physical and attribute keeping their own value", () => {
    for (const breakthrough of [20, 21]) {
      const resistance = penResistanceForBreakthrough(breakthrough)
      expect(resistance.physical).toBe(20)
      expect(resistance.attribute).toBe(24)
    }
  })

  it("routes penResistanceForInputs through the input's own breakthrough", () => {
    expect(penResistanceForInputs({ ...defaultInputs, breakthrough: 19 })).toEqual({
      physical: 0,
      attribute: 0,
    })
    expect(penResistanceForInputs({ ...defaultInputs, breakthrough: 20 })).toEqual({
      physical: 20,
      attribute: 24,
    })
  })
})

describe("arsenalHp", () => {
  it("sums graduated stores plus the current store at Total Mastery, per breakthrough", () => {
    expect(arsenalHp(13)).toBe(19100)
    expect(arsenalHp(14)).toBe(23100)
    expect(arsenalHp(15)).toBe(23100)
    expect(arsenalHp(16)).toBe(23200)
    expect(arsenalHp(17)).toBe(23200)
    expect(arsenalHp(18)).toBe(27400)
    expect(arsenalHp(19)).toBe(27400)
    expect(arsenalHp(20)).toBe(31800)
    expect(arsenalHp(21)).toBe(31800)
  })

  it("never reports less HP for a higher breakthrough", () => {
    const breakthroughs = [13, 14, 15, 16, 17, 18, 19, 20, 21]
    for (const [index, breakthrough] of breakthroughs.slice(1).entries()) {
      expect(arsenalHp(breakthrough)).toBeGreaterThanOrEqual(arsenalHp(breakthroughs[index]))
    }
  })

  it("adds the Tier 91 store's real overflow score into the breakthrough-17 total: 26,477.5, carrying the fractional ratio_b term", () => {
    const scores = { ...defaultArsenalScores(), 8: 7200 }
    expect(arsenalHp(17, scores)).toBeCloseTo(26477.5, 9)
  })
})

describe("arsenal store states — the three branches", () => {
  it("pays the flat graduation_promotion once a past store reaches Total Mastery", () => {
    const state = arsenalStoreState(8, arsenalScoreCap(8), true)
    expect(state.graduated).toBe(true)
    expect(arsenalStoreHp(state)).toBe(4200)
  })

  it("pays the overflow formula instead of the flat amount below Total Mastery — the 4,100 HP cliff", () => {
    const state = arsenalStoreState(8, 0, true)
    expect(state.graduated).toBe(false)
    expect(arsenalStoreHp(state)).toBe(100)
  })

  it("lets the current store's score run past Total Mastery, still on the overflow formula", () => {
    const state = arsenalStoreState(8, 7200, false)
    expect(state.graduated).toBe(false)
    expect(arsenalStoreHp(state)).toBeCloseTo(3377.5, 9)
  })

  it("reads store 2's Total Mastery as 1000, not its ratio_c of 860", () => {
    expect(arsenalScoreCap(2)).toBe(1000)

    const atRatioC = arsenalStoreState(2, 860, true)
    expect(atRatioC.graduated).toBe(false)
    expect(arsenalStoreHp(atRatioC)).toBe(100)

    const atTotalMastery = arsenalStoreState(2, 1000, true)
    expect(atTotalMastery.graduated).toBe(true)
    expect(arsenalStoreHp(atTotalMastery)).toBe(3200)
  })
})
