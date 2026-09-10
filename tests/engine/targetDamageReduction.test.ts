import { describe, expect, it } from "vitest"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { buildContext } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"

type Art = Parameters<typeof computeSkillDamage>[0]
const artRow = (fields: Record<string, unknown>) => fields as unknown as Art

const WEAPON_ROW = artRow({
  name: "Weapon row",
  physMultiplier: 0.062,
  physFixed: 14,
  attributeMultiplier: 0.093,
  attributeFixed: 8,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
})

const NON_SCALING_TRACK_ROW = artRow({
  name: "Non-scaling track row",
  physMultiplier: 0.1,
  attributeMultiplier: 0.2,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bamboocut",
})

const baseCtx: FormulaContext = {
  smallPhys: 1043,
  largePhys: 2006,
  outerPen: 29.2,
  bellstrike: { min: 57, max: 0, pen: 0 },
  stonesplit: { min: 28, max: 0, pen: 0 },
  silkbind: { min: 0, max: 0, pen: 0 },
  bamboocut: { min: 352, max: 502, pen: 21.2 },
  primaryAttribute: "Bamboocut",
  precisionPanel: 0.9,
  critPanel: 0.5,
  affinityPanel: 0.2,
  directCritPanel: 0,
  directAffinityPanel: 0,
  physDmgBoostPanel: 0.4,
  critDmgBoostPanel: 0.579,
  affinityDmgBoostPanel: 0.35,
  attributeDmgBoostPanel: 0.076,
  sustainDmgBoostPanel: 0,
  generalDamageBoost: 0,
  chargeBonus: 0,
  effectiveDefense: 307,
  fatigueDamageTaken: 0,
  hasSixHenZhi: false,
  food: false,
  set: null,
  tianGong: null,
  classSpecificAttunement: {},
  shareDebuffs: { henZhi: false, easyHurt: false },
}

const bamboocutOnlyCtx: FormulaContext = {
  ...baseCtx,
  bellstrike: { min: 0, max: 0, pen: 0 },
  stonesplit: { min: 0, max: 0, pen: 0 },
}

const bellstrikeOnlyCtx: FormulaContext = {
  ...baseCtx,
  smallPhys: 0,
  largePhys: 0,
  effectiveDefense: 0,
  bellstrike: { min: 400, max: 600, pen: 0 },
  stonesplit: { min: 0, max: 0, pen: 0 },
  bamboocut: { min: 0, max: 0, pen: 0 },
}

const damageOf = (art: Art, ctx: FormulaContext) => computeSkillDamage(art, ctx, 1).expectedDamage

describe("target damage reduction", () => {
  it("scales the whole row by 1 − damageReduction", () => {
    const base = damageOf(WEAPON_ROW, baseCtx)
    const reduced = damageOf(WEAPON_ROW, { ...baseCtx, damageReduction: 0.25 })

    expect(reduced).toBeCloseTo(base * 0.75, 6)
  })

  it("multiplies rather than subtracting from the additive boost total", () => {
    const asFactor = damageOf(WEAPON_ROW, {
      ...baseCtx,
      generalDamageBoost: 0.5,
      damageReduction: 0.2,
    })
    const asAddend = damageOf(WEAPON_ROW, { ...baseCtx, generalDamageBoost: 0.3 })

    expect(asFactor).toBeCloseTo(damageOf(WEAPON_ROW, baseCtx) * 1.5 * 0.8, 6)
    expect(asFactor).toBeLessThan(asAddend)
  })

  it("scales a damage-over-time row alongside its own multiplier", () => {
    const overTime = { ...baseCtx, dotDamageMultiplier: 1.4 }
    const reduced = damageOf(WEAPON_ROW, { ...overTime, damageReduction: 0.25 })

    expect(reduced).toBeCloseTo(damageOf(WEAPON_ROW, overTime) * 0.75, 6)
  })

  it("scales a rolled hit by the same factor as the expected value", () => {
    const fixedDraw = () => 0.5
    const base = computeSkillDamage(WEAPON_ROW, baseCtx, 1, fixedDraw).rolled!
    const reduced = computeSkillDamage(
      WEAPON_ROW,
      { ...baseCtx, damageReduction: 0.25 },
      1,
      fixedDraw,
    ).rolled!

    expect(reduced.damage).toBeCloseTo(base.damage * 0.75, 6)
  })

  it("defaults to no reduction when the context omits it", () => {
    expect(damageOf(WEAPON_ROW, { ...baseCtx, damageReduction: 0 })).toBe(
      damageOf(WEAPON_ROW, baseCtx),
    )
  })
})

describe("target physical damage-boost reduction", () => {
  it("subtracts inside the physical boost bracket", () => {
    const reduced = damageOf(WEAPON_ROW, { ...baseCtx, physDamageBoostReduction: 0.2 })
    const loweredPanel = damageOf(WEAPON_ROW, { ...baseCtx, physDmgBoostPanel: 0.2 })

    expect(reduced).toBeCloseTo(loweredPanel, 6)
  })

  it("floors the physical boost bracket at zero", () => {
    const floored = computeSkillDamage(WEAPON_ROW, { ...baseCtx, physDamageBoostReduction: 2 }, 1)
    const flooredHarder = computeSkillDamage(
      WEAPON_ROW,
      { ...baseCtx, physDamageBoostReduction: 3 },
      1,
    )

    expect(floored.cells.AK).toBe(0)
    expect(floored.expectedDamage).toBe(flooredHarder.expectedDamage)
    expect(floored.expectedDamage).toBeGreaterThan(0)
  })
})

describe("target attribute damage-boost reduction", () => {
  it("subtracts inside the attribute boost bracket", () => {
    const reduced = damageOf(WEAPON_ROW, { ...bamboocutOnlyCtx, attrDamageBoostReduction: 0.05 })
    const loweredPanel = damageOf(WEAPON_ROW, {
      ...bamboocutOnlyCtx,
      attributeDmgBoostPanel: 0.026,
    })

    expect(reduced).toBeCloseTo(loweredPanel, 6)
  })

  it("reaches an attribute track the panel boost does not scale", () => {
    const base = computeSkillDamage(NON_SCALING_TRACK_ROW, bellstrikeOnlyCtx, 1).cells.DZ
    const reduced = computeSkillDamage(
      NON_SCALING_TRACK_ROW,
      { ...bellstrikeOnlyCtx, attrDamageBoostReduction: 0.25 },
      1,
    ).cells.DZ
    const loweredPanel = computeSkillDamage(
      NON_SCALING_TRACK_ROW,
      { ...bellstrikeOnlyCtx, attributeDmgBoostPanel: 0 },
      1,
    ).cells.DZ

    expect(base).toBeGreaterThan(0)
    expect(reduced).toBeCloseTo(base * 0.75, 6)
    expect(loweredPanel).toBe(base)
  })

  it("floors the attribute boost bracket at zero", () => {
    const floored = damageOf(WEAPON_ROW, { ...bamboocutOnlyCtx, attrDamageBoostReduction: 2 })
    const flooredHarder = damageOf(WEAPON_ROW, { ...bamboocutOnlyCtx, attrDamageBoostReduction: 3 })

    expect(floored).toBe(flooredHarder)
    expect(floored).toBeLessThan(damageOf(WEAPON_ROW, bamboocutOnlyCtx))
    expect(floored).toBeGreaterThan(0)
  })
})

describe("target crit damage reduction", () => {
  it("subtracts from the crit damage multiplier", () => {
    const cells = computeSkillDamage(WEAPON_ROW, { ...baseCtx, critDamageReduction: 0.2 }, 1).cells

    expect(cells.X).toBeCloseTo(0.379, 9)
  })

  it("is clamped by the crit damage minimum instead of escaping it", () => {
    const cells = computeSkillDamage(WEAPON_ROW, { ...baseCtx, critDamageReduction: 0.5 }, 1).cells

    expect(cells.X).toBeCloseTo(0.35, 9)
  })

  it("cannot pull a clamped crit damage multiplier below its maximum", () => {
    const overCap = { ...baseCtx, critDmgBoostPanel: 1.6 }
    const cells = computeSkillDamage(WEAPON_ROW, { ...overCap, critDamageReduction: 0.05 }, 1).cells

    expect(cells.X).toBeCloseTo(1.5, 9)
  })
})

describe("target affinity damage reduction", () => {
  it("subtracts from the affinity damage multiplier", () => {
    const cells = computeSkillDamage(
      WEAPON_ROW,
      { ...baseCtx, affinityDamageReduction: 0.1 },
      1,
    ).cells

    expect(cells.Y).toBeCloseTo(0.25, 9)
  })

  it("is clamped by the affinity damage minimum instead of escaping it", () => {
    const cells = computeSkillDamage(
      WEAPON_ROW,
      { ...baseCtx, affinityDamageReduction: 0.3 },
      1,
    ).cells

    expect(cells.Y).toBeCloseTo(0.2, 9)
  })

  it("cannot pull a clamped affinity damage multiplier below its maximum", () => {
    const overCap = { ...baseCtx, affinityDmgBoostPanel: 1.5 }
    const cells = computeSkillDamage(
      WEAPON_ROW,
      { ...overCap, affinityDamageReduction: 0.1 },
      1,
    ).cells

    expect(cells.Y).toBeCloseTo(1.3, 9)
  })
})

describe("the target block feeding the formula context", () => {
  it("carries every reduction from the target's breakthrough tier", () => {
    for (const tier of BREAKTHROUGH_TIERS) {
      const ctx = buildContext({
        ...defaultInputs,
        breakthrough: tier.breakthrough,
        dummyMode: false,
      })

      expect(ctx.damageReduction).toBe(tier.damageReduction)
      expect(ctx.physDamageBoostReduction).toBe(tier.physDamageBoostReduction)
      expect(ctx.attrDamageBoostReduction).toBe(tier.attrDamageBoostReduction)
      expect(ctx.critDamageReduction).toBe(tier.critDamageReduction)
      expect(ctx.affinityDamageReduction).toBe(tier.affinityDamageReduction)
    }
  })

  it("zeroes every reduction against a training dummy", () => {
    for (const tier of BREAKTHROUGH_TIERS) {
      const ctx = buildContext({
        ...defaultInputs,
        breakthrough: tier.breakthrough,
        dummyMode: true,
      })

      expect(ctx.damageReduction).toBe(0)
      expect(ctx.physDamageBoostReduction).toBe(0)
      expect(ctx.attrDamageBoostReduction).toBe(0)
      expect(ctx.critDamageReduction).toBe(0)
      expect(ctx.affinityDamageReduction).toBe(0)
    }
  })
})
