import { describe, expect, it } from "vitest"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"
import { buildContext } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { SET_ID } from "../../src/data/sets/ids"

type Art = Parameters<typeof computeSkillDamage>[0]

const NEUTRAL_CONTEXT: Partial<FormulaContext> = {
  precisionPanel: 1,
  critPanel: 0,
  affinityPanel: 0,
  directCritPanel: 0,
  directAffinityPanel: 0,
  effectiveDefense: 0,
  food: false,
  physDmgBoostPanel: 0,
  attributeDmgBoostPanel: 0,
  critDmgBoostPanel: 0,
  affinityDmgBoostPanel: 0,
  outerPen: 0,
  hasSixHenZhi: false,
  smallPhys: 1000,
  largePhys: 1000,
  bellstrike: { min: 1000, max: 1000, pen: 0 },
}

const baseContext = (overrides: Partial<FormulaContext> = {}): FormulaContext => ({
  ...buildContext({ ...defaultInputs, classId: "bellstrikeUmbra" }),
  ...NEUTRAL_CONTEXT,
  ...overrides,
})

const physicalRow = (overrides: Record<string, unknown> = {}): Art =>
  ({
    name: "Physical",
    physMultiplier: 1,
    physFixed: 0,
    attributeMultiplier: 0,
    attributeFixed: 0,
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    correction: 1,
    ...overrides,
  }) as unknown as Art

const attributeRow = (overrides: Record<string, unknown> = {}): Art =>
  physicalRow({ physMultiplier: 0, attributeMultiplier: 1, ...overrides })

const damageOf = (art: Art, context: FormulaContext) =>
  computeSkillDamage(art, context, 1).expectedDamage

describe("physical attack rates share one additive pool", () => {
  it("adds the set rate to a buff rate instead of multiplying them", () => {
    const base = damageOf(physicalRow(), baseContext())
    const rated = damageOf(
      physicalRow({ minPhysPctBonus: 0.2, maxPhysPctBonus: 0.2 }),
      baseContext({ hawkwingPhysBonus: 0.1 }),
    )
    expect(rated / base).toBeCloseTo(1.3, 10)
  })

  it("leaves a flat buff bonus out of the rates", () => {
    const base = damageOf(physicalRow(), baseContext())
    const rated = damageOf(
      physicalRow({
        minPhysPctBonus: 0.5,
        maxPhysPctBonus: 0.5,
        minPhysFlatBonus: 100,
        maxPhysFlatBonus: 100,
      }),
      baseContext(),
    )
    expect(rated / base).toBeCloseTo(1.6, 10)
  })
})

describe("the Hawkwing fallback without a scheduler", () => {
  it("raises physical and Bellstrike attack by the same full-stack rate", () => {
    const withSet = baseContext({ set: SET_ID.hawkwing })
    expect(damageOf(physicalRow(), withSet) / damageOf(physicalRow(), baseContext())).toBeCloseTo(
      1.09,
      10,
    )
    expect(damageOf(attributeRow(), withSet) / damageOf(attributeRow(), baseContext())).toBeCloseTo(
      1.09,
      10,
    )
  })
})

describe("attribute attack rates and the Formless share", () => {
  const withFormless = { formlessAttack: { min: 200, max: 200 } }

  it("applies a Bellstrike-only rate to the block without its Formless attack", () => {
    const base = damageOf(attributeRow(), baseContext(withFormless))
    const rated = damageOf(
      attributeRow(),
      baseContext({ ...withFormless, bellstrikeAttackPctBonus: 0.1 }),
    )
    expect(rated / base).toBeCloseTo((800 * 1.1 + 200) / 1000, 10)
  })

  it("applies a rate every attack type shares to the whole block", () => {
    const base = damageOf(attributeRow(), baseContext(withFormless))
    const rated = damageOf(
      attributeRow({ attributeAttackPctBonus: 0.1 }),
      baseContext(withFormless),
    )
    expect(rated / base).toBeCloseTo(1.1, 10)
  })

  it("adds both rates on the part outside Formless attack", () => {
    const base = damageOf(attributeRow(), baseContext(withFormless))
    const rated = damageOf(
      attributeRow({ attributeAttackPctBonus: 0.1 }),
      baseContext({ ...withFormless, bellstrikeAttackPctBonus: 0.1 }),
    )
    expect(rated / base).toBeCloseTo((800 * 1.2 + 200 * 1.1) / 1000, 10)
  })

  it("scales the whole block when no Formless attack is derived", () => {
    const base = damageOf(attributeRow(), baseContext())
    const rated = damageOf(attributeRow(), baseContext({ bellstrikeAttackPctBonus: 0.1 }))
    expect(rated / base).toBeCloseTo(1.1, 10)
  })
})
