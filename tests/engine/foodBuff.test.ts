// Every recipe food must produce exactly the same damage as no food with the
// bonus folded into `phys.min`/`phys.max` — that equivalence is what makes
// showing `base + bonus` as the yellow "effective" min/max phys an honest
// display, per CLAUDE.md § "Buffs" category 1.
import { describe, expect, it } from "vitest"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage, effectivePhysRange } from "../../src/engine/formula"
import { blankInputs, defaultInputs } from "../../src/engine/defaults"
import {
  ATTACK_FOODS,
  HP_FOODS,
  appliedAttackFood,
  appliedHpFood,
  bestRecipeAttackFoodAt,
  type AttackFoodId,
  type HpFoodId,
} from "../../src/data/consumables/foods"
import type { Inputs } from "../../src/engine/types"

const ART = { name: "Test Weapon Hit", physMultiplier: 1, physFixed: 0, skillType: "weapon" }
const BASE_PHYS = { min: 900, max: 2500 }
const PERCENT_PHYS_BONUS = 0.5

function base(overrides: Partial<Inputs>, physOverride?: { min: number; max: number }): Inputs {
  return {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    breakthrough: 20,
    food: null,
    hpFood: null,
    phys: {
      min: physOverride?.min ?? BASE_PHYS.min,
      max: physOverride?.max ?? BASE_PHYS.max,
      penetration: 0.2,
    },
    ...overrides,
  }
}

function damage(inputs: Inputs, art: object = ART): number {
  return computeSkillDamage(art as never, buildContext(inputs), 1).expectedDamage
}

const RECIPE_FOODS = ATTACK_FOODS.filter((food) => food.channel === "beforeMultiplier")

describe("recipe attack foods", () => {
  it.each(RECIPE_FOODS.map((food) => [food.id, food] as const))(
    "%s adds exactly its range to the raw min/max phys",
    (_id, food) => {
      if (food.channel !== "beforeMultiplier") throw new Error("not a recipe food")
      const withFood = damage(base({ food: food.id }))
      const foldedIn = damage(
        base(
          {},
          { min: BASE_PHYS.min + food.physAttack.min, max: BASE_PHYS.max + food.physAttack.max },
        ),
      )
      expect(withFood).toBeCloseTo(foldedIn, 9)
      expect(withFood).toBeGreaterThan(damage(base({})))
    },
  )

  it("adds the fish slices range as +120 min and +240 max", () => {
    expect(appliedAttackFood({ food: "simmeringFishSlices", breakthrough: 16 })).toMatchObject({
      physAttack: { min: 120, max: 240 },
    })
  })

  it("clamps max phys only after both food bonuses are applied", () => {
    expect(effectivePhysRange(1000, 900, { min: 120, max: 240 })).toEqual({ min: 1120, max: 1140 })
    expect(effectivePhysRange(1200, 900, { min: 120, max: 240 })).toEqual({ min: 1320, max: 1320 })
  })

  it("multiplies the food range by the % Physical Attack bonus", () => {
    const boosted = { ...ART, minPhysPctBonus: PERCENT_PHYS_BONUS, maxPhysPctBonus: 0 }
    const withFood = damage(base({ food: "doubleShreds" }), boosted)
    const foldedIn = damage(
      base({}, { min: BASE_PHYS.min + 50, max: BASE_PHYS.max + 100 }),
      boosted,
    )
    expect(withFood).toBeCloseTo(foldedIn, 9)
  })
})

describe("the attack bun flat buff", () => {
  const percentArt = { ...ART, minPhysPctBonus: PERCENT_PHYS_BONUS, maxPhysPctBonus: 0.25 }

  it("is not multiplied by the % Physical Attack bonus", () => {
    const withBun = damage(base({ food: "caiNengjiaAttackBun" }), percentArt)
    const multiplied = damage(
      base({}, { min: BASE_PHYS.min + 90, max: BASE_PHYS.max + 180 }),
      percentArt,
    )
    expect(withBun).toBeGreaterThan(damage(base({}), percentArt))
    expect(withBun).toBeLessThan(multiplied)
  })

  it("equals the same range authored as a skill's own flat bonus", () => {
    const withBun = damage(base({ food: "caiNengjiaAttackBun" }), percentArt)
    const asArtFlat = damage(base({}), {
      ...percentArt,
      minPhysFlatBonus: 90,
      maxPhysFlatBonus: 180,
    })
    expect(withBun).toBeCloseTo(asArtFlat, 9)
  })

  it("leaves the raw phys range the % multiplier reads untouched", () => {
    const context = buildContext(base({ food: "caiNengjiaAttackBun" }))
    expect(context.foodPhysAttack).toEqual({ min: 0, max: 0 })
    expect(context.flatPhysAttack).toEqual({ min: 90, max: 180 })
  })
})

describe("foods that change no damage", () => {
  it.each(HP_FOODS.map((food) => food.id))("%s changes nothing", (id: HpFoodId) => {
    expect(damage(base({ hpFood: id }))).toBe(damage(base({})))
  })
})

describe("breakthrough gate", () => {
  it.each(ATTACK_FOODS.map((food) => [food.id, food.minBreakthrough] as const))(
    "%s applies from its minimum breakthrough and not one below",
    (id: AttackFoodId, minBreakthrough) => {
      expect(appliedAttackFood({ food: id, breakthrough: minBreakthrough - 1 })).toBeNull()
      expect(appliedAttackFood({ food: id, breakthrough: minBreakthrough })?.id).toBe(id)
    },
  )

  it.each(HP_FOODS.map((food) => [food.id, food.minBreakthrough] as const))(
    "%s applies from its minimum breakthrough and not one below",
    (id: HpFoodId, minBreakthrough) => {
      expect(appliedHpFood({ hpFood: id, breakthrough: minBreakthrough - 1 })).toBeNull()
      expect(appliedHpFood({ hpFood: id, breakthrough: minBreakthrough })?.id).toBe(id)
    },
  )

  it("scores a food below its gate as no food, leaving the stored value alone", () => {
    const belowGate = base({ food: "twinImmortalsStew", breakthrough: 16 })
    expect(belowGate.food).toBe("twinImmortalsStew")
    expect(damage(belowGate)).toBe(damage(base({ breakthrough: 16 })))
  })

  it("keeps an unrecognised stored food and scores nothing for it", () => {
    const unknown = base({ food: "aFoodFromALaterBuild" as never })
    expect(unknown.food).toBe("aFoodFromALaterBuild")
    expect(damage(unknown)).toBe(damage(base({})))
  })
})

describe("the default food", () => {
  it("is a food the default breakthrough can eat", () => {
    expect(defaultInputs.food).toBe(bestRecipeAttackFoodAt(defaultInputs.breakthrough))
    expect(appliedAttackFood(defaultInputs)).not.toBeNull()
  })

  it("is the strongest food a blank profile's breakthrough can eat", () => {
    expect(appliedAttackFood(blankInputs)?.id).toBe(
      bestRecipeAttackFoodAt(blankInputs.breakthrough),
    )
  })

  it("is the strongest recipe food at each breakthrough, never a bun", () => {
    expect(bestRecipeAttackFoodAt(12)).toBeNull()
    expect(bestRecipeAttackFoodAt(14)).toBe("wildGinsengMeatballs")
    expect(bestRecipeAttackFoodAt(20)).toBe("twinImmortalsStew")
  })
})
