// `food: true` must produce exactly the same damage as `food: false` with the
// bonus folded into `phys.min`/`phys.max` — that equivalence is what makes
// showing `base + bonus` as the yellow "effective" min/max phys an honest
// display, per CLAUDE.md § "Buffs" category 1.
import { describe, expect, it } from "vitest"
import { buildContext } from "../../src/engine/panel"
import {
  computeSkillDamage,
  effectivePhysRange,
  FOOD_MIN_PHYS_BONUS,
  FOOD_MAX_PHYS_BONUS,
} from "../../src/engine/formula"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const SLOTS: [string, string, string, string, string] = ["N/A", "N/A", "N/A", "N/A", "N/A"]
const ART = { name: "Test Weapon Hit", physMultiplier: 1, physFixed: 0, skillType: "weapon" }

function base(food: boolean, physOverride?: { min: number; max: number }): Inputs {
  return {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    set: null,
    food,
    phys: { min: physOverride?.min ?? 900, max: physOverride?.max ?? 2500, penetration: 0.2 },
  }
}

function damage(inputs: Inputs): number {
  return computeSkillDamage(ART as never, SLOTS, buildContext(inputs), 1).expectedDamage
}

describe("food buff (Simmering Fish Slices)", () => {
  it("is +120 min / +240 max raw phys", () => {
    expect(FOOD_MIN_PHYS_BONUS).toBe(120)
    expect(FOOD_MAX_PHYS_BONUS).toBe(240)
  })

  it("raises damage", () => {
    expect(damage(base(true))).toBeGreaterThan(damage(base(false)))
  })

  it("clamps max phys only after both food bonuses are applied", () => {
    expect(effectivePhysRange(1000, 900, true)).toEqual({ min: 1120, max: 1140 })
    expect(effectivePhysRange(1200, 900, true)).toEqual({ min: 1320, max: 1320 })
  })

  it("is exactly a flat addition to the raw min/max phys terms", () => {
    const withFood = damage(base(true))
    const foldedIn = damage(
      base(false, { min: 900 + FOOD_MIN_PHYS_BONUS, max: 2500 + FOOD_MAX_PHYS_BONUS }),
    )
    expect(withFood).toBeCloseTo(foldedIn, 9)
  })
})
