import { describe, expect, it } from "vitest"
import { deriveStats, getSchool, getBreakthrough } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"

describe("panel.deriveStats", () => {
  it("resolves the class & target metadata", () => {
    const d = deriveStats(defaultInputs)
    expect(d.classId).toBe("bamboocutWindTwinblade")
    expect(d.primaryAttribute).toBe("Bamboocut")
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
  it("knows all 7 classes", () => {
    for (const id of [
      "silkbindJade",
      "stonesplitPower",
      "bamboocutWindTwinblade",
      "bellstrikeUmbra",
      "bellstrikeRainbow",
      "bamboocutDust",
      "stonesplitStrength",
    ]) {
      expect(getSchool(id).id).toBe(id)
    }
  })

  it("knows the locked-fixture breakthrough", () => {
    expect(getBreakthrough(13).defense).toBe(308)
  })
})
