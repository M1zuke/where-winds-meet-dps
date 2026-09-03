import { describe, expect, it } from "vitest"
import { formlessAttack, getConfiguredBase } from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const BREAKTHROUGH = defaultInputs.breakthrough

// The `general` arsenal feeds `phys`, so nothing but the talent tables' own
// Formless attack is left on the primary attribute block.
function withNothingElseOnThePrimaryBlock(classId: string): Inputs {
  return {
    ...defaultInputs,
    classId,
    arsenal: "general",
    martialArtsTalents: [],
    oddities: {},
  }
}

describe("Formless attack from the talent tables", () => {
  it("reaches the accumulator", () => {
    expect(formlessAttack(BREAKTHROUGH).min).toBeGreaterThan(0)
    expect(formlessAttack(BREAKTHROUGH).max).toBeGreaterThan(0)
  })

  it("lands on Bellstrike for a class whose primary attribute is Bellstrike", () => {
    const base = getConfiguredBase(withNothingElseOnThePrimaryBlock("bellstrikeUmbra"))
    expect(base["bellstrike.min"]).toBeCloseTo(formlessAttack(BREAKTHROUGH).min, 9)
    expect(base["bellstrike.max"]).toBeCloseTo(formlessAttack(BREAKTHROUGH).max, 9)
  })

  it("lands on Stonesplit for a class whose primary attribute is Stonesplit", () => {
    const base = getConfiguredBase(withNothingElseOnThePrimaryBlock("stonesplitStrength"))
    expect(base["stonesplit.min"]).toBeCloseTo(formlessAttack(BREAKTHROUGH).min, 9)
    expect(base["stonesplit.max"]).toBeCloseTo(formlessAttack(BREAKTHROUGH).max, 9)
    expect(base["bellstrike.max"] ?? 0).toBe(0)
  })

  it("leaves the physical block to the physical talents", () => {
    const bellstrike = getConfiguredBase(withNothingElseOnThePrimaryBlock("bellstrikeUmbra"))
    const stonesplit = getConfiguredBase(withNothingElseOnThePrimaryBlock("stonesplitStrength"))
    expect(bellstrike["phys.min"]).toBe(stonesplit["phys.min"])
    expect(bellstrike["phys.max"]).toBe(stonesplit["phys.max"])
    expect(bellstrike["phys.max"]).toBeGreaterThan(formlessAttack(BREAKTHROUGH).max)
  })
})
