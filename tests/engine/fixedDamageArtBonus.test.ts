import { makeSkill, makeHit } from "../../src/engine/skill"
import { describe, expect, it } from "vitest"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { dotTickDamage, resolveTickDot } from "../../src/engine/dot"
import { makeDebuff } from "../../src/engine/debuff"

type Art = Parameters<typeof computeSkillDamage>[0]
const art_ = (a: Record<string, unknown>) => a as unknown as Art

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
  fatigueDamageTaken: 0,
  hasSixHenZhi: false,
  food: false,
  set: null,
  divinecraft: null,
  classSpecificAttunement: {
    "classSpecificAttunement 1": 0,
    "classSpecificAttunement 2": 0,
    "classSpecificAttunement 3": 0,
  },
  shareDebuffs: { henZhi: false, easyHurt: false },
}

const FLAT_ROW = art_({
  name: "Flat Row",
  physMultiplier: 0.062,
  physFixed: 14,
  attributeMultiplier: 0.093,
  attributeFixed: 8,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
})

const ZERO_FLAT_ROW = art_({
  ...FLAT_ROW,
  name: "Zero Flat Row",
  physFixed: 0,
  attributeFixed: 0,
})

describe("fixedDamagePctBonus — scales a row's flat damage terms", () => {
  it("deals more than the same row with no bonus, matching the flat terms pre-multiplied", () => {
    const bonused = computeSkillDamage({ ...FLAT_ROW, fixedDamagePctBonus: 0.3 }, baseCtx, 1)
    const plain = computeSkillDamage(FLAT_ROW, baseCtx, 1)
    const preScaled = computeSkillDamage(
      {
        ...FLAT_ROW,
        physFixed: FLAT_ROW.physFixed! * 1.3,
        attributeFixed: FLAT_ROW.attributeFixed! * 1.3,
      },
      baseCtx,
      1,
    )
    expect(bonused.expectedDamage).toBeGreaterThan(plain.expectedDamage)
    expect(bonused.expectedDamage).toBeCloseTo(preScaled.expectedDamage, 9)
  })

  it("is byte-identical with and without the bonus when both flat terms are zero", () => {
    const bonused = computeSkillDamage({ ...ZERO_FLAT_ROW, fixedDamagePctBonus: 0.3 }, baseCtx, 1)
    const plain = computeSkillDamage(ZERO_FLAT_ROW, baseCtx, 1)
    expect(bonused).toEqual(plain)
  })

  it("leaves a row's coefficient terms unaffected when its flat terms are zero", () => {
    const bonused = computeSkillDamage({ ...ZERO_FLAT_ROW, fixedDamagePctBonus: 0.5 }, baseCtx, 1)
    const plain = computeSkillDamage(ZERO_FLAT_ROW, baseCtx, 1)
    expect(bonused.expectedDamage).toBeCloseTo(plain.expectedDamage, 9)
  })

  it("composes with the art's attribute-flat multiplier, applying before it", () => {
    const ctxWithMultiplier = { ...baseCtx, attributeFlatMultiplier: 1.5 }
    const bonused = computeSkillDamage(
      { ...FLAT_ROW, fixedDamagePctBonus: 0.3 },
      ctxWithMultiplier,
      1,
    ).cells
    const plain = computeSkillDamage(FLAT_ROW, ctxWithMultiplier, 1).cells
    expect(bonused.BS).toBeCloseTo(plain.BS * 1.3, 9)
  })
})

describe("dotTickDamage — fixedDamagePctBonus arrives through artBonuses", () => {
  const flatDot = makeDebuff("bellstrikeUmbra", {
    name: "Flat Tick",
    dot: {
      tickIntervalFrames: 60,
      physMultiplier: 0.2,
      physFixed: 25,
      attributeMultiplier: 0.3,
      attributeFixed: 10,
      attributeAttack: "Bamboocut",
      skillType: "weapon",
      weaponOrAttribute: "Rope Dart",
      count: 1,
      perStackShapes: null,
      perStackMultipliers: null,
    },
  })

  const flatlessDot = makeDebuff("bellstrikeUmbra", {
    name: "Flatless Tick",
    dot: {
      ...flatDot.dot!,
      physFixed: 0,
      attributeFixed: 0,
    },
  })

  it("scales a tick that carries a flat term", () => {
    const bonused = dotTickDamage(
      flatDot,
      baseCtx,
      computeSkillDamage,
      false,
      undefined,
      undefined,
      {
        fixedDamagePctBonus: 0.3,
      },
    )
    const plain = dotTickDamage(flatDot, baseCtx, computeSkillDamage)
    expect(bonused.damage).toBeGreaterThan(plain.damage)
  })

  it("leaves a flat-less tick untouched", () => {
    const bonused = dotTickDamage(
      flatlessDot,
      baseCtx,
      computeSkillDamage,
      false,
      undefined,
      undefined,
      { fixedDamagePctBonus: 0.3 },
    )
    const plain = dotTickDamage(flatlessDot, baseCtx, computeSkillDamage)
    expect(bonused.damage).toBeCloseTo(plain.damage, 9)
  })
})

describe("tick source attribute scaling", () => {
  it.each([false, true, undefined])(
    "preserves %s through source resolution and damage calculation",
    (elevatedAttributeMultiplier) => {
      const hit = makeHit({
        physMultiplier: 0.2,
        attributeMultiplier: 0.6,
        physFixed: 25,
        attributeFixed: 10,
      })
      const source = makeSkill("bamboocutDraught", {
        attributeAttack: "Bamboocut",
        elevatedAttributeMultiplier,
        hits: [hit],
        skillType: "sustain",
      })
      const debuff = makeDebuff("bamboocutDraught", {
        dot: {
          tickIntervalFrames: 60,
          ...hit,
          attributeAttack: "Bamboocut",
          skillType: "sustain",
          count: 1,
        },
      })
      const ctx = { ...baseCtx, attributeFlatMultiplier: 1.5 }
      const resolved = { ...debuff, dot: resolveTickDot(debuff, source) }
      const tick = dotTickDamage(resolved, ctx, computeSkillDamage).damage
      const direct = computeSkillDamage(
        {
          name: "Reference",
          ...hit,
          attributeAttack: "Bamboocut",
          elevatedAttributeMultiplier,
          skillType: "sustain",
          specialTag: "sustain",
        },
        ctx,
        1,
      ).expectedDamage
      expect(tick).toBeCloseTo(direct, 9)
      if (elevatedAttributeMultiplier === false) {
        const elevated = dotTickDamage(
          { ...resolved, dot: { ...resolved.dot!, elevatedAttributeMultiplier: true } },
          ctx,
          computeSkillDamage,
        ).damage
        expect(tick).toBeLessThan(elevated)
      }
    },
  )
})
