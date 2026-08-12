import { describe, expect, it } from "vitest"
import {
  computeSkillDamage,
  FOOD_MAX_PHYS_BONUS,
  FOOD_MIN_PHYS_BONUS,
} from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { runEngine } from "../../src/engine/dps"
import { penResistanceForLevel } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

type Art = Parameters<typeof computeSkillDamage>[0]
const art_ = (a: Record<string, unknown>) => a as unknown as Art

// Directional fixtures: each pins one damage *shape* the rules below act on
// (a plain weapon row, a bleed DoT row, a mystic DoT tick, a charged crit row).
// The absolute numbers carry no meaning — every assertion here is a comparison.
const ROPE_DART_Q = art_({
  name: "Rope Dart Q",
  physMultiplier: 0.062,
  physFixed: 14,
  attributeMultiplier: 0.093,
  attributeFixed: 8,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
})

const BLEED_DOT = art_({
  name: "Bleed (5 stack)",
  physMultiplier: 0.33,
  attributeMultiplier: 0.495,
  extraAffinityRate: 0,
  extraAffinityDamage: 0.3,
  correction: 1,
  extraPhysPenetration: 15,
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  specialTag: "sustain",
})

const COMBUSTION_TICK = art_({
  name: "Combustion / tick",
  physMultiplier: 0.2953,
  physFixed: 39,
  attributeMultiplier: 0.2953,
  extraAffinityRate: 0,
  extraAffinityDamage: 0.3,
  correction: 1,
  skillType: "mystic",
  mysticCategory: "burst",
  attributeAttack: "Bellstrike",
  specialTag: "sustain",
})

const MODAO_CHARGE = art_({
  name: "Modao R-Charge 2",
  physMultiplier: 3.8964,
  physFixed: 900,
  attributeMultiplier: 5.8446,
  attributeFixed: 503,
  maxPhysFlatBonus: 60,
  extraCritRate: 0.24,
  extraCritDamage: 0.1,
  correction: 1,
  usesChargeBoost: 1,
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
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
  attributePrimaryBonus: 34,
  precisionPanel: 0.9,
  critPanel: 0.5,
  affinityPanel: 0.2,
  directCritPanel: 0,
  directAffinityPanel: 0,
  physDmgBoostPanel: 0,
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
  dingYinByTag: { "DingYin 1": 0, "DingYin 2": 0, "DingYin 3": 0 },
  shareDebuffs: { henZhi: false, easyHurt: false },
}

const art = ROPE_DART_Q

describe("physical attack range normalization", () => {
  it("uses min phys as the effective max when min phys exceeds max phys", () => {
    const inverted = computeSkillDamage(
      MODAO_CHARGE,
      slots,
      { ...baseCtx, smallPhys: 2000, largePhys: 1000 },
      1,
    )
    const normalized = computeSkillDamage(
      MODAO_CHARGE,
      slots,
      { ...baseCtx, smallPhys: 2000, largePhys: 2000 },
      1,
    )

    expect(inverted.cells.AG).toBeCloseTo(normalized.cells.AG, 9)
    expect(inverted.expectedDamage).toBeCloseTo(normalized.expectedDamage, 9)
  })

  it("keeps equal min and max phys equal when no range-specific modifiers apply", () => {
    const cells = computeSkillDamage(
      art,
      slots,
      { ...baseCtx, smallPhys: 2000, largePhys: 2000 },
      1,
    ).cells

    expect(cells.AG).toBeCloseTo(cells.AE, 9)
  })

  it("applies food before choosing the effective max phys", () => {
    const withFood = computeSkillDamage(
      MODAO_CHARGE,
      slots,
      { ...baseCtx, smallPhys: 1000, largePhys: 900, food: true },
      1,
    )
    const foodFoldedIntoPanel = computeSkillDamage(
      MODAO_CHARGE,
      slots,
      {
        ...baseCtx,
        smallPhys: 1000 + FOOD_MIN_PHYS_BONUS,
        largePhys: 900 + FOOD_MAX_PHYS_BONUS,
        food: false,
      },
      1,
    )

    expect(withFood.cells.AG).toBeCloseTo(foodFoldedIntoPanel.cells.AG, 9)
    expect(withFood.expectedDamage).toBeCloseTo(foodFoldedIntoPanel.expectedDamage, 9)
  })
})

// PDF §8
describe("graze (abrasion) rate — (1 − precision)(1 − affinity)", () => {
  it("AL ≈ (1 − U)(1 − W), strictly smaller than (1 − U) when W > 0", () => {
    const cells = computeSkillDamage(art, baseCtx, 1).cells
    expect(cells.AL).toBeCloseTo((1 - cells.U) * (1 - cells.W), 9)
    expect(cells.AL).toBeLessThan(1 - cells.U)
  })

  it("AL === 0 at 100 % effective precision", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, precisionPanel: 1 }, 1).cells
    expect(cells.AL).toBe(0)
  })
})

// Deliberately INVERTS PDF §7 (overflow ÷200, deficit ÷100)
describe("penetration — net(pen − resistance), ÷100 deficit / ÷200 overflow", () => {
  it("with resistance omitted (0), AH > 0", () => {
    const cells = computeSkillDamage(art, baseCtx, 1).cells
    expect(cells.AH).toBeGreaterThan(0)
  })

  it("when physical resistance exceeds pen, deficit is ÷100 ⇒ AH < 0", () => {
    const base = computeSkillDamage(art, baseCtx, 1).cells
    const withRes = computeSkillDamage(art, { ...baseCtx, physPenResistance: 100 }, 1).cells
    expect(withRes.AH).toBeLessThan(0)
    expect(withRes.AH).toBeCloseTo((base.AH * 200 - 100) / 100, 9)
  })

  it("a build with pen resistance deals less damage than the res-0 build", () => {
    const base = computeSkillDamage(art, baseCtx, 1).expectedDamage
    const withRes = computeSkillDamage(
      art,
      { ...baseCtx, physPenResistance: 100, attrPenResistance: 100 },
      1,
    ).expectedDamage
    expect(withRes).toBeLessThan(base)
  })

  it("penResistanceForLevel is zero for every target", () => {
    for (const lvl of [80, 85, 90, 95, 100]) {
      expect(penResistanceForLevel(lvl)).toEqual({ physical: 0, attribute: 0 })
    }
  })
})

// PDF §1
describe("DoT rules — elevatedAttributeMultiplier-gated (PDF §1)", () => {
  const bleed = BLEED_DOT
  const combustion = COMBUSTION_TICK

  it("bleed: the DoT variant (elevatedAttributeMultiplier: false) deals strictly less", () => {
    const eligible = computeSkillDamage(bleed, baseCtx, 1).expectedDamage
    const demoted = computeSkillDamage(
      { ...bleed, elevatedAttributeMultiplier: false },
      baseCtx,
      1,
    ).expectedDamage
    expect(demoted).toBeLessThan(eligible)
  })

  it("combustion: AT > 0 when eligible, exactly 0 for the DoT variant", () => {
    const eligible = computeSkillDamage(combustion, baseCtx, 1)
    const demoted = computeSkillDamage(
      { ...combustion, elevatedAttributeMultiplier: false },
      baseCtx,
      1,
    )
    expect(eligible.cells.AT).toBeGreaterThan(0)
    expect(demoted.cells.AT).toBe(0)
    expect(demoted.expectedDamage).toBeLessThan(eligible.expectedDamage)
  })

  it("a row with the flag omitted keeps its flat damage (AT ≈ physFixed)", () => {
    const cells = computeSkillDamage(combustion, baseCtx, 1).cells
    expect(cells.AT).toBeCloseTo(combustion.physFixed ?? 0, 9)
  })
})

// PDF §11. `art.extraAffinityRate` is the one raw rate source the formula
// receives, so it is the vehicle for the shared divide-before-cap rule that
// both rate cells implement.
describe("rate resistance on a raw rate source (PDF §11)", () => {
  it("a raw affinity-rate source is divided by (1 + r) before the 40 % cap", () => {
    const rawRate = { ...art, extraAffinityRate: 0.1 }
    const noRes = computeSkillDamage(rawRate, baseCtx, 1).cells
    const withRes = computeSkillDamage(rawRate, { ...baseCtx, rateResistance: 0.3 }, 1).cells
    expect(noRes.W).toBeCloseTo(baseCtx.affinityPanel + 0.1, 9)
    expect(withRes.W).toBeCloseTo(baseCtx.affinityPanel + 0.1 / 1.3, 9)
  })

  it("Thundercry (Modao) charged bonus crit is FLAT: unresisted, added after the cap", () => {
    const modao = MODAO_CHARGE
    const cells = computeSkillDamage(
      modao,
      { ...baseCtx, critPanel: 0.7, rateResistance: 0.3 },
      1,
    ).cells
    expect(cells.V).toBeCloseTo(0.7 + 0.24, 9)
  })
})

describe("burst detonation is exempt from the DoT rule", () => {
  const matchAttr = baseCtx.primaryAttribute
  const mkArt = (burst: boolean) =>
    ({
      name: "Blood Burst",
      physMultiplier: 2.4,
      attributeMultiplier: 3.6,
      physFixed: 100,
      attributeFixed: 0,
      skillType: "sustain",
      specialTag: "sustain",
      attributeAttack: matchAttr,
      weaponOrAttribute: matchAttr,
      elevatedAttributeMultiplier: burst ? undefined : false,
    }) as unknown as Parameters<typeof computeSkillDamage>[0]

  it("with the flag omitted (burst), AT keeps its flat damage and out-damages the demoted variant", () => {
    const burst = computeSkillDamage(mkArt(true), baseCtx, 1)
    const demoted = computeSkillDamage(mkArt(false), baseCtx, 1)
    expect(burst.cells.AT).toBeCloseTo(100, 9)
    expect(demoted.cells.AT).toBe(0)
    expect(burst.expectedDamage).toBeGreaterThan(demoted.expectedDamage)
  })
})

describe("end-to-end via runEngine", () => {
  it("the default build produces positive DPS", () => {
    expect(runEngine(umbraInputs).dps).toBeGreaterThan(0)
  })

  it("lowering precision lowers DPS", () => {
    const lowered = runEngine({ ...umbraInputs, precision: 0.8 }).dps
    const base = runEngine(umbraInputs).dps
    expect(lowered).toBeLessThan(base)
  })
})
