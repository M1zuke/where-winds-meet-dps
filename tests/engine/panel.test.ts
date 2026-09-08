import { describe, expect, it } from "vitest"
import {
  deriveStats,
  getSchool,
  getBreakthrough,
  penResistanceForBreakthrough,
  penResistanceForInputs,
} from "../../src/engine/panel"
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
