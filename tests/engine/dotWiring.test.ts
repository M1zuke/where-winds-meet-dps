import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"

describe("DoT wiring — bellstrikeUmbra bleed", () => {
  it("the default rotation deals real bleed-tick damage", () => {
    const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
    const dotRow = result.perSkill.find((p) => p.name.includes("(DoT)") && p.expectedDamage > 0)
    expect(dotRow).toBeTruthy()
    expect(result.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
  })

  it("builtinDebuffsForClass exposes the bleed debuff with the expected per-tick shape", () => {
    const debuffs = builtinDebuffsForClass("bellstrikeUmbra")
    const bleed = debuffs.find((d) => d.dot && d.dot.physMultiplier === 0.066)
    expect(bleed).toBeTruthy()
    expect(bleed!.dot!.attributeMultiplier).toBeCloseTo(0.099, 10)
    expect(bleed!.dot!.tickIntervalFrames).toBe(60)
    expect(bleed!.maxStacks).toBe(5)
    expect(bleed!.stackScaling).toBe("perStack")
    expect(bleed!.dot!.perStackMultipliers).toEqual([2, 2.5, 3, 4, 5])
  })
})

describe("DoT wiring — the default rotation still resolves", () => {
  it("dps > 0, no missing-rotation / exception warnings", () => {
    const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((w) => /no default rotation/i.test(w))).toBe(false)
    expect(result.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
  })
})
