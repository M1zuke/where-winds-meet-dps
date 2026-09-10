import { describe, expect, it } from "vitest"
import {
  AFFINITY_DAMAGE_MULTIPLIER_MAX,
  AFFINITY_DAMAGE_MULTIPLIER_MIN,
  computeSkillDamage,
  CRIT_DAMAGE_MULTIPLIER_MAX,
  CRIT_DAMAGE_MULTIPLIER_MIN,
  FOOD_MAX_PHYS_BONUS,
  FOOD_MIN_PHYS_BONUS,
} from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { runEngine } from "../../src/engine/dps"
import { buildContext } from "../../src/engine/panel"
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
  hasSixHenZhi: false,
  food: false,
  set: null,
  tianGong: null,
  classSpecificAttunement: {
    "classSpecificAttunement 1": 0,
    "classSpecificAttunement 2": 0,
    "classSpecificAttunement 3": 0,
  },
  shareDebuffs: { henZhi: false, easyHurt: false },
}

const art = ROPE_DART_Q

describe("physical attack range normalization", () => {
  it("uses min phys as the effective max when min phys exceeds max phys", () => {
    const inverted = computeSkillDamage(
      MODAO_CHARGE,
      { ...baseCtx, smallPhys: 2000, largePhys: 1000 },
      1,
    )
    const normalized = computeSkillDamage(
      MODAO_CHARGE,
      { ...baseCtx, smallPhys: 2000, largePhys: 2000 },
      1,
    )

    expect(inverted.cells.AG).toBeCloseTo(normalized.cells.AG, 9)
    expect(inverted.expectedDamage).toBeCloseTo(normalized.expectedDamage, 9)
  })

  it("keeps equal min and max phys equal when no range-specific modifiers apply", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, smallPhys: 2000, largePhys: 2000 }, 1).cells

    expect(cells.AG).toBeCloseTo(cells.AE, 9)
  })

  it("applies food before choosing the effective max phys", () => {
    const withFood = computeSkillDamage(
      MODAO_CHARGE,
      { ...baseCtx, smallPhys: 1000, largePhys: 900, food: true },
      1,
    )
    const foodFoldedIntoPanel = computeSkillDamage(
      MODAO_CHARGE,
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

// Corrects PDF §7 (overflow ÷200, deficit ÷100)
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

  it("a build at breakthrough 20 deals less damage than the same build with its pen resistance zeroed", () => {
    const ctx20 = buildContext({ ...defaultInputs, breakthrough: 20 })
    const ctx20WithoutPenResistance = { ...ctx20, physPenResistance: 0, attrPenResistance: 0 }
    const damageWithPenResistance = computeSkillDamage(art, ctx20, 1).expectedDamage
    const damageWithoutPenResistance = computeSkillDamage(
      art,
      ctx20WithoutPenResistance,
      1,
    ).expectedDamage
    expect(damageWithPenResistance).toBeLessThan(damageWithoutPenResistance)
  })
})

describe("keeps the matching-path multiplier on a damage-over-time row", () => {
  const bleed = BLEED_DOT
  const combustion = COMBUSTION_TICK

  it("bleed: left at its default, a DoT row matches an explicitly elevated one and beats a demoted one", () => {
    const atDefault = computeSkillDamage(bleed, baseCtx, 1).expectedDamage
    const elevated = computeSkillDamage(
      { ...bleed, elevatedAttributeMultiplier: true },
      baseCtx,
      1,
    ).expectedDamage
    const demoted = computeSkillDamage(
      { ...bleed, elevatedAttributeMultiplier: false },
      baseCtx,
      1,
    ).expectedDamage
    expect(atDefault).toBeCloseTo(elevated, 9)
    expect(atDefault).toBeGreaterThan(demoted)
  })

  it("combustion: flat survives an explicit demotion, and a non-matching path is untouched by it", () => {
    const atDefault = computeSkillDamage(combustion, baseCtx, 1)
    const demoted = computeSkillDamage(
      { ...combustion, elevatedAttributeMultiplier: false },
      baseCtx,
      1,
    )
    expect(atDefault.cells.AT).toBeCloseTo(combustion.physFixed ?? 0, 9)
    expect(demoted.cells.AT).toBeCloseTo(combustion.physFixed ?? 0, 9)
    expect(demoted.expectedDamage).toBeCloseTo(atDefault.expectedDamage, 9)
  })
})

describe("the attribute flat term takes the martial art's multiplier alongside its coefficient", () => {
  const artWithFlat = { ...BLEED_DOT, attributeFixed: 40 }
  const ctxWithMultiplier = { ...baseCtx, attributeFlatMultiplier: 1.5 }

  it("an elevated row scales its flat rows by the context multiplier", () => {
    const scaled = computeSkillDamage(artWithFlat, ctxWithMultiplier, 1).cells
    const unscaled = computeSkillDamage(
      artWithFlat,
      { ...ctxWithMultiplier, attributeFlatMultiplier: 1 },
      1,
    ).cells
    expect(scaled.BS).toBeCloseTo(unscaled.BS * 1.5, 9)
  })

  it("with no context multiplier supplied, the flat term stays unscaled", () => {
    const withoutField = computeSkillDamage(artWithFlat, baseCtx, 1).cells
    const withExplicitOne = computeSkillDamage(
      artWithFlat,
      { ...baseCtx, attributeFlatMultiplier: 1 },
      1,
    ).cells
    expect(withoutField.BS).toBeCloseTo(withExplicitOne.BS, 9)
  })

  it("a demoted row ignores the context multiplier on the flat term, same as its coefficient", () => {
    const demotedWithMultiplier = computeSkillDamage(
      { ...artWithFlat, elevatedAttributeMultiplier: false },
      ctxWithMultiplier,
      1,
    ).cells
    const demotedWithoutMultiplier = computeSkillDamage(
      { ...artWithFlat, elevatedAttributeMultiplier: false },
      { ...ctxWithMultiplier, attributeFlatMultiplier: 1 },
      1,
    ).cells
    expect(demotedWithMultiplier.BS).toBeCloseTo(demotedWithoutMultiplier.BS, 9)
  })

  it("a demoted row deals less total damage than the same row elevated", () => {
    const elevated = computeSkillDamage(artWithFlat, ctxWithMultiplier, 1).expectedDamage
    const demoted = computeSkillDamage(
      { ...artWithFlat, elevatedAttributeMultiplier: false },
      ctxWithMultiplier,
      1,
    ).expectedDamage
    expect(demoted).toBeLessThan(elevated)
  })
})

// PDF §11
describe("a skill's own rate bonus is added undivided, inside the cap", () => {
  it("a skill's crit-rate bonus cannot push the capped part above the cap", () => {
    const cells = computeSkillDamage(MODAO_CHARGE, { ...baseCtx, critPanel: 0.7 }, 1).cells
    expect(cells.V).toBeCloseTo(0.8 + baseCtx.directCritPanel, 9)
  })

  it("a skill's affinity-rate bonus is added undivided onto the already-resisted panel rate", () => {
    const rawRate = { ...art, extraAffinityRate: 0.1 }
    const cells = computeSkillDamage(rawRate, baseCtx, 1).cells
    expect(cells.W).toBeCloseTo(baseCtx.affinityPanel + 0.1, 9)
  })

  it("the direct crit rate still sits outside the cap", () => {
    const cells = computeSkillDamage(
      art,
      { ...baseCtx, critPanel: 1, directCritPanel: 0.05 },
      1,
    ).cells
    expect(cells.V).toBeCloseTo(0.8 + 0.05, 9)
  })

  it("the direct affinity rate still sits outside the cap", () => {
    const cells = computeSkillDamage(
      art,
      { ...baseCtx, affinityPanel: 1, directAffinityPanel: 0.05 },
      1,
    ).cells
    expect(cells.W).toBeCloseTo(0.4 + 0.05, 9)
  })

  it("a panel rate driven negative by resistance cannot go below zero", () => {
    const cells = computeSkillDamage(
      art,
      { ...baseCtx, critPanel: -0.5, affinityPanel: -0.5 },
      1,
    ).cells
    expect(cells.V).toBeCloseTo(baseCtx.directCritPanel, 9)
    expect(cells.W).toBeCloseTo(baseCtx.directAffinityPanel, 9)
  })
})

describe("keeps the matching-path multiplier on a sustain-tagged burst row", () => {
  const matchAttr = baseCtx.primaryAttribute
  const mkArt = (elevated: boolean | undefined) =>
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
      elevatedAttributeMultiplier: elevated,
    }) as unknown as Parameters<typeof computeSkillDamage>[0]

  it("with the flag left at its default, a sustain-tagged row out-damages an explicitly demoted one", () => {
    const atDefault = computeSkillDamage(mkArt(undefined), baseCtx, 1)
    const demoted = computeSkillDamage(mkArt(false), baseCtx, 1)
    expect(atDefault.cells.AT).toBeCloseTo(100, 9)
    expect(demoted.cells.AT).toBeCloseTo(100, 9)
    expect(atDefault.expectedDamage).toBeGreaterThan(demoted.expectedDamage)
  })
})

describe("crit- and affinity-damage multipliers are clamped", () => {
  it("caps the crit multiplier at its ceiling", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, critDmgBoostPanel: 5 }, 1).cells
    expect(cells.X).toBeCloseTo(CRIT_DAMAGE_MULTIPLIER_MAX - 1, 9)
  })

  it("raises the crit multiplier to its floor", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, critDmgBoostPanel: -2 }, 1).cells
    expect(cells.X).toBeCloseTo(CRIT_DAMAGE_MULTIPLIER_MIN - 1, 9)
  })

  it("leaves a crit multiplier inside the range untouched", () => {
    const cells = computeSkillDamage(art, baseCtx, 1).cells
    expect(cells.X).toBeCloseTo(baseCtx.critDmgBoostPanel, 9)
  })

  it("caps the affinity multiplier at its ceiling", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, affinityDmgBoostPanel: 5 }, 1).cells
    expect(cells.Y).toBeCloseTo(AFFINITY_DAMAGE_MULTIPLIER_MAX - 1, 9)
  })

  it("raises the affinity multiplier to its floor", () => {
    const cells = computeSkillDamage(art, { ...baseCtx, affinityDmgBoostPanel: -2 }, 1).cells
    expect(cells.Y).toBeCloseTo(AFFINITY_DAMAGE_MULTIPLIER_MIN - 1, 9)
  })

  it("leaves an affinity multiplier inside the range untouched", () => {
    const cells = computeSkillDamage(art, baseCtx, 1).cells
    expect(cells.Y).toBeCloseTo(baseCtx.affinityDmgBoostPanel, 9)
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
