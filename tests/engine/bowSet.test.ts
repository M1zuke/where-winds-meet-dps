import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { applyBowSet, bowSetValueForLevel } from "../../src/engine/panel"
import type { BowSet, GearLevel, Inputs } from "../../src/engine/types"

const BREAKTHROUGH_BY_GEAR_LEVEL: Readonly<Record<GearLevel, number>> = {
  86: 13,
  91: 14,
  96: 16,
  100: 18,
  105: 20,
}

const EXPECTED_BONUS: Readonly<Record<Exclude<BowSet, null>, Readonly<Record<GearLevel, number>>>> =
  {
    precision: { 86: 0, 91: 0.033, 96: 0.04, 100: 0.047, 105: 0.054 },
    crit: { 86: 0, 91: 0.037, 96: 0.045, 100: 0.052, 105: 0.061 },
    affinity: { 86: 0, 91: 0.018, 96: 0.022, 100: 0.026, 105: 0.03 },
  }

function withBowSet(bowSet: BowSet, gearLevel: GearLevel): Inputs {
  return { ...defaultInputs, bowSet, breakthrough: BREAKTHROUGH_BY_GEAR_LEVEL[gearLevel] }
}

describe("bow set bonus by gear level", () => {
  for (const [choice, byLevel] of Object.entries(EXPECTED_BONUS)) {
    for (const [levelKey, expected] of Object.entries(byLevel)) {
      const gearLevel = Number(levelKey) as GearLevel
      it(`${choice} at gear level ${gearLevel} reads ${expected}`, () => {
        expect(bowSetValueForLevel(choice as BowSet, gearLevel)).toBe(expected)
      })
    }
  }

  it("adds the precision bonus to precision only", () => {
    const base = withBowSet(null, 100)
    const applied = applyBowSet(withBowSet("precision", 100))
    expect(applied.precision).toBeCloseTo(base.precision + 0.047, 10)
    expect(applied.critRate).toBe(base.critRate)
    expect(applied.affinityRate).toBe(base.affinityRate)
  })

  it("adds the crit bonus to crit rate only", () => {
    const base = withBowSet(null, 105)
    const applied = applyBowSet(withBowSet("crit", 105))
    expect(applied.critRate).toBeCloseTo(base.critRate + 0.061, 10)
    expect(applied.precision).toBe(base.precision)
    expect(applied.affinityRate).toBe(base.affinityRate)
  })

  it("adds the affinity bonus to affinity rate only", () => {
    const base = withBowSet(null, 91)
    const applied = applyBowSet(withBowSet("affinity", 91))
    expect(applied.affinityRate).toBeCloseTo(base.affinityRate + 0.018, 10)
    expect(applied.precision).toBe(base.precision)
    expect(applied.critRate).toBe(base.critRate)
  })

  it("adds nothing at a gear level no bow carries the set at", () => {
    const inputs = withBowSet("crit", 86)
    expect(applyBowSet(inputs)).toEqual(inputs)
  })

  it("adds nothing with no bow set, or with a stored value it does not recognise", () => {
    const none = withBowSet(null, 100)
    expect(applyBowSet(none)).toEqual(none)
    const unrecognised = { ...none, bowSet: "somethingElse" as unknown as BowSet }
    expect(applyBowSet(unrecognised)).toEqual(unrecognised)
  })
})
