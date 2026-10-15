import { describe, expect, it } from "vitest"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"
import { hawkwingMechanic } from "../../src/data/sets/hawkwingMechanic"
import { hawkwingStacksSchedule } from "../../src/engine/buffs/hawkwing"
import { SET_ID } from "../../src/data/sets/ids"
import { defaultInputs } from "../../src/engine/defaults"
import { mulberry32 } from "../../src/engine/rng"
import type { MechanicSetup } from "../../src/engine/mechanics/types"

const CLASS = "bellstrikeUmbra"

function setupWith(
  hitTimesSec: number[],
  dotTickTimesSec: number[],
  windowStartSec = 0,
): MechanicSetup {
  return {
    inputs: { ...defaultInputs, classId: CLASS, set: SET_ID.hawkwing, directAffinityRate: 0 },
    classId: CLASS,
    fps: 60,
    rotationDurationSec: 10,
    windowStartSec,
    hitTimesSec,
    weaponHitTimesSec: hitTimesSec,
    dotTickTimesSec,
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: false,
    effectiveRates: { precision: 1, critRate: 0, affinityRate: 1 },
    rng: mulberry32(1),
  }
}

describe("Hawkwing procs off a DoT tick, not only a cast hit", () => {
  it("ramps stacks from dotTickTimesSec alone when the rotation lands no direct hit", () => {
    const setup = setupWith([], [0.1, 0.2, 0.3, 0.4, 0.5])
    const state = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(setup)!

    const stacksAt = (timeSec: number) => state.schedule.getExpectedStacksAtTime(timeSec)
    expect(stacksAt(0.5)).toBeGreaterThan(0)
  })

  it("matches a schedule built from the merged, sorted hit and tick times", () => {
    const setup = setupWith([0.15, 0.45], [0.1, 0.2, 0.3, 0.4, 0.5])
    const state = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(setup)!

    const expectedSchedule = hawkwingStacksSchedule(
      [0.1, 0.15, 0.2, 0.3, 0.4, 0.45, 0.5],
      0.4,
      10,
      mulberry32(1),
    )
    for (let step = 0; step < 200; step++) {
      const timeSec = step * 0.05
      expect(state.schedule.getExpectedStacksAtTime(timeSec)).toBe(
        expectedSchedule.getExpectedStacksAtTime(timeSec),
      )
    }
  })

  it("a later windowStartSec, hit and tick times unchanged, does not move the schedule", () => {
    const hitTimesSec = [0.15, 0.45]
    const dotTickTimesSec = [0.1, 0.2, 0.3, 0.4, 0.5]
    const atZero = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(
      setupWith(hitTimesSec, dotTickTimesSec, 0),
    )!
    const atLaterStart = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(
      setupWith(hitTimesSec, dotTickTimesSec, 5),
    )!
    for (let step = 0; step < 200; step++) {
      const timeSec = step * 0.05
      expect(atLaterStart.schedule.getExpectedStacksAtTime(timeSec)).toBe(
        atZero.schedule.getExpectedStacksAtTime(timeSec),
      )
    }
  })
})

describe("Hawkwing's per-stack bonus", () => {
  it("grants 1.8% to Physical and Bellstrike attack per stack", () => {
    const setup = setupWith([0.1, 0.2, 0.3, 0.4, 0.5], [])
    const mechanic = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing")
    const state = mechanic.prepare(setup)!
    const stacks = Math.round(state.schedule.getExpectedStacksAtTime(0.5))
    expect(stacks).toBeGreaterThan(0)
    const contribution = mechanic.contributeAt?.(state, 30, undefined as never, setup)
    expect(contribution?.context?.hawkwingPhysBonus).toBeCloseTo(stacks * 0.018, 12)
    expect(contribution?.context?.bellstrikeAttackPctBonus).toBeCloseTo(stacks * 0.018, 12)
  })

  const baseCtx: FormulaContext = {
    smallPhys: 1000,
    largePhys: 2000,
    outerPen: 0,
    bellstrike: { min: 400, max: 600, pen: 0 },
    stonesplit: { min: 400, max: 600, pen: 0 },
    silkbind: { min: 0, max: 0, pen: 0 },
    bamboocut: { min: 0, max: 0, pen: 0 },
    primaryAttribute: "Bellstrike",
    precisionPanel: 1,
    critPanel: 0.5,
    affinityPanel: 0.2,
    directCritPanel: 0,
    directAffinityPanel: 0,
    physDmgBoostPanel: 0,
    critDmgBoostPanel: 0.5,
    affinityDmgBoostPanel: 0.3,
    attributeDmgBoostPanel: 0,
    sustainDmgBoostPanel: 0,
    generalDamageBoost: 0,
    chargeBonus: 0,
    effectiveDefense: 0,
    fatigueDamageTaken: 0,
    hasSixHenZhi: false,
    food: false,
    set: null,
    divinecraft: null,
    classSpecificAttunement: {},
    shareDebuffs: { henZhi: false, easyHurt: false },
  }

  const damageOf = (attribute: "Bellstrike" | "Stonesplit", bellstrikeAttackPctBonus: number) =>
    computeSkillDamage(
      {
        name: "Probe",
        physMultiplier: 0,
        physFixed: 0,
        attributeMultiplier: 1,
        attributeFixed: 0,
        correction: 1,
        skillType: "weapon",
        weaponOrAttribute: "Sword",
        attributeAttack: attribute,
      } as Parameters<typeof computeSkillDamage>[0],
      { ...baseCtx, primaryAttribute: attribute, bellstrikeAttackPctBonus },
      1,
    ).expectedDamage

  it("raises Bellstrike damage only", () => {
    expect(damageOf("Bellstrike", 0.09)).toBeGreaterThan(damageOf("Bellstrike", 0))
    expect(damageOf("Stonesplit", 0.09)).toBe(damageOf("Stonesplit", 0))
  })
})
