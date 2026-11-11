import { describe, expect, it } from "vitest"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"

type Art = Parameters<typeof computeSkillDamage>[0]

const WEAPON_ROW: Art = {
  name: "weapon row",
  physMultiplier: 1.2,
  physFixed: 40,
  attributeMultiplier: 1.8,
  attributeFixed: 20,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
}

const MYSTIC_ROW: Art = {
  name: "mystic row",
  physMultiplier: 0.9,
  physFixed: 30,
  attributeMultiplier: 1.35,
  correction: 1,
  skillType: "mystic",
  mysticCategory: "burst",
}

const ATTRIBUTE_ONLY_ROW: Art = {
  name: "attribute-only row",
  physMultiplier: 0,
  attributeMultiplier: 1.5,
  correction: 1,
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
}

const CONTEXT: FormulaContext = {
  smallPhys: 2400,
  largePhys: 4700,
  outerPen: 30,
  bellstrike: { min: 600, max: 1100, pen: 20 },
  stonesplit: { min: 40, max: 80, pen: 0 },
  silkbind: { min: 40, max: 80, pen: 0 },
  bamboocut: { min: 40, max: 80, pen: 0 },
  primaryAttribute: "Bellstrike",
  precisionPanel: 0.9,
  critPanel: 0.5,
  affinityPanel: 0.3,
  directCritPanel: 0,
  directAffinityPanel: 0,
  physDmgBoostPanel: 0.05,
  critDmgBoostPanel: 0.6,
  affinityDmgBoostPanel: 0.4,
  attributeDmgBoostPanel: 0.1,
  sustainDmgBoostPanel: 0,
  generalDamageBoost: 0.2,
  allDamageBoost: 0.1,
  effectiveDefense: 500,
  hasSixHenZhi: false,
  set: null,
  divinecraft: null,
  classSpecificAttunement: {},
  shareDebuffs: { henZhi: false, easyHurt: false },
  weaponBoosts: { Sword: 0.07 },
  allMartialBoost: 0.03,
  mysticTypeBoosts: { burst: 0.05 },
  allMysticBoost: 0,
}

const damage = (art: Art, patch: Partial<FormulaContext> = {}) =>
  computeSkillDamage(art, { ...CONTEXT, ...patch }, 1).expectedDamage

describe("penetration curve", () => {
  it("costs one hundredth per point of a deficit up to 75 points", () => {
    const cells = computeSkillDamage(WEAPON_ROW, { ...CONTEXT, physPenResistance: 104 }, 1).cells
    expect(cells.AH).toBe(-0.74)
  })

  it("follows −4d ÷ (4d + 100) for a deficit beyond 75 points", () => {
    const deep = computeSkillDamage(WEAPON_ROW, { ...CONTEXT, physPenResistance: 130 }, 1).cells
    const pastTheKnee = computeSkillDamage(
      WEAPON_ROW,
      { ...CONTEXT, physPenResistance: 108 },
      1,
    ).cells
    expect(deep.AH).toBe(-0.8)
    expect(pastTheKnee.AH).toBeCloseTo(-312 / 412, 15)
  })

  it("follows the same curve on an attribute track", () => {
    const even = damage(ATTRIBUTE_ONLY_ROW, { attrPenResistance: 20 })
    const deep = damage(ATTRIBUTE_ONLY_ROW, { attrPenResistance: 120 })
    expect(deep / even).toBeCloseTo(0.2, 12)
  })

  it("halves an overflow", () => {
    const cells = computeSkillDamage(WEAPON_ROW, CONTEXT, 1).cells
    expect(cells.AH).toBe(0.15)
  })
})

describe("hit-outcome chances", () => {
  it("rolls affinity before crit after a precision success, so crit takes only what affinity leaves", () => {
    const cells = computeSkillDamage(
      WEAPON_ROW,
      { ...CONTEXT, critPanel: 0.8, directCritPanel: 0.1, affinityPanel: 0.35 },
      1,
    ).cells
    expect(cells.AN).toBeCloseTo(0.9 * (1 - 0.35), 15)
  })

  it("rolls crit at its full rate while crit and affinity fit together", () => {
    const cells = computeSkillDamage(WEAPON_ROW, CONTEXT, 1).cells
    expect(cells.AN).toBeCloseTo(0.9 * 0.5, 15)
  })

  it("rolls affinity at its own rate whatever the precision", () => {
    const cells = computeSkillDamage(WEAPON_ROW, { ...CONTEXT, precisionPanel: 0.5 }, 1).cells
    expect(cells.AP).toBe(0.3)
  })

  it("abrades only when precision, affinity and the abrasion-avoid roll all fail", () => {
    const cells = computeSkillDamage(
      { ...WEAPON_ROW, abrasionAvoidRate: 0.25 },
      { ...CONTEXT, precisionPanel: 0.6 },
      1,
    ).cells
    expect(cells.AL).toBeCloseTo(0.4 * 0.7 * 0.75, 15)
  })
})

describe("the additive damage pool", () => {
  it("adds the weapon line and All Martial Arts to the same pool as an all-damage boost", () => {
    const viaLines = damage(WEAPON_ROW, { weaponBoosts: { Sword: 0.12 }, allMartialBoost: 0.08 })
    const viaPool = damage(WEAPON_ROW, { allDamageBoost: 0.1 + 0.05 + 0.05 })
    expect(viaLines).toBeCloseTo(viaPool, 9)
  })

  it("adds All Mystic Skill DMG Boost to the same pool on a mystic row", () => {
    const viaLine = damage(MYSTIC_ROW, { allMysticBoost: 0.114 })
    const viaPool = damage(MYSTIC_ROW, { allDamageBoost: 0.1 + 0.114 })
    expect(viaLine).toBeCloseTo(viaPool, 9)
  })

  it("gives All Mystic Skill DMG Boost nothing on a martial-art row", () => {
    expect(damage(WEAPON_ROW, { allMysticBoost: 0.114 })).toBe(damage(WEAPON_ROW))
  })

  it("gives the weapon line and All Martial Arts nothing on a mystic row", () => {
    expect(damage(MYSTIC_ROW, { weaponBoosts: { Sword: 0.5 }, allMartialBoost: 0.5 })).toBe(
      damage(MYSTIC_ROW),
    )
  })
})

describe("factors outside the pool", () => {
  it("multiplies the attunement in as its own factor", () => {
    const art = { ...WEAPON_ROW, attuneTags: ["probe"] }
    const attuned = damage(art, { attuneBoostByTag: { probe: 0.07 } })
    expect(attuned / damage(art)).toBeCloseTo(1.07, 12)
  })

  it("multiplies the independent boost in as its own factor", () => {
    expect(damage(WEAPON_ROW, { independentDamageBoost: 0.1 }) / damage(WEAPON_ROW)).toBeCloseTo(
      1.1,
      12,
    )
  })
})
