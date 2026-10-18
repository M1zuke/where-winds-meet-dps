import { describe, expect, it } from "vitest"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"
import { hawkwingMechanic } from "../../src/data/sets/hawkwingMechanic"
import { SET_ID } from "../../src/data/sets/ids"
import { defaultInputs } from "../../src/engine/defaults"
import { mulberry32 } from "../../src/engine/rng"
import type {
  MechanicEventSource,
  MechanicHost,
  MechanicObservedEvent,
  MechanicSetup,
} from "../../src/engine/mechanics/types"
import { gearSetFields } from "../helpers/withGearSet"

const CLASS = "bellstrikeUmbra"

function setupWith(patch: Partial<MechanicSetup> = {}): MechanicSetup {
  return {
    inputs: {
      ...defaultInputs,
      classId: CLASS,
      ...gearSetFields(SET_ID.hawkwing, { fabricatePieces: true }),
      directAffinityRate: 0,
    },
    classId: CLASS,
    fps: 60,
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: false,
    effectiveRates: { precision: 1, critRate: 0, affinityRate: 1 },
    collectHistory: true,
    rng: mulberry32(1),
    ...patch,
  }
}

const NO_HOST = {} as MechanicHost

function event(
  source: MechanicEventSource,
  timeSec: number,
  canRollAffinity = true,
): MechanicObservedEvent {
  return {
    source,
    timeSec,
    occurrence: 1,
    direct: source !== "tick",
    canRollAffinity,
    affinityChance: 0,
  }
}

function mechanicAndState(setup: MechanicSetup) {
  const mechanic = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing")
  return { mechanic, state: mechanic.prepare(setup)! }
}

describe("Hawkwing rolls off every scored damage event that can roll Affinity", () => {
  it("ramps stacks from DoT ticks alone when the rotation lands no direct hit", () => {
    const setup = setupWith()
    const { mechanic, state } = mechanicAndState(setup)
    for (const timeSec of [0.1, 0.2, 0.3, 0.4, 0.5])
      mechanic.observeEvent!(state, event("tick", timeSec), setup, NO_HOST)
    expect(state.tracker.expectedStacksAt(0.5)).toBeGreaterThan(0)
  })

  it("rolls the same for a hit and for a tick", () => {
    const hitSetup = setupWith()
    const tickSetup = setupWith()
    const hitSide = mechanicAndState(hitSetup)
    const tickSide = mechanicAndState(tickSetup)
    for (const timeSec of [0.1, 0.2, 0.3]) {
      hitSide.mechanic.observeEvent!(hitSide.state, event("hit", timeSec), hitSetup, NO_HOST)
      tickSide.mechanic.observeEvent!(tickSide.state, event("tick", timeSec), tickSetup, NO_HOST)
    }
    expect(tickSide.state.tracker.expectedStacksAt(0.5)).toBe(
      hitSide.state.tracker.expectedStacksAt(0.5),
    )
  })

  it("rolls on a mechanic's own extra event that can roll Affinity", () => {
    const setup = setupWith()
    const { mechanic, state } = mechanicAndState(setup)
    for (const timeSec of [0.1, 0.2, 0.3])
      mechanic.observeEvent!(state, event("extra", timeSec), setup, NO_HOST)
    expect(state.tracker.expectedStacksAt(0.5)).toBeGreaterThan(0)
  })

  it("ignores an event that can never roll Affinity, whatever its source", () => {
    const setup = setupWith()
    const { mechanic, state } = mechanicAndState(setup)
    for (const source of ["hit", "tick", "extra"] as const)
      for (const timeSec of [0.1, 0.2, 0.3])
        mechanic.observeEvent!(state, event(source, timeSec, false), setup, NO_HOST)
    expect(state.tracker.expectedStacksAt(0.5)).toBe(0)
  })
})

describe("Hawkwing's per-stack bonus", () => {
  it("grants 1.8% to Physical and Bellstrike attack per stack, from the first roll on", () => {
    const setup = setupWith({ rng: undefined })
    const { mechanic, state } = mechanicAndState(setup)
    expect(mechanic.contributeAt?.(state, 30, undefined, setup)?.context?.hawkwingPhysBonus).toBe(0)
    for (const timeSec of [0.1, 0.2, 0.3, 0.4, 0.5])
      mechanic.observeEvent!(state, event("hit", timeSec), setup, NO_HOST)
    const stacks = state.tracker.expectedStacksAt(0.5)
    expect(stacks).toBeGreaterThan(0)
    expect(stacks).not.toBe(Math.round(stacks))
    const contribution = mechanic.contributeAt?.(state, 30, undefined, setup)
    expect(contribution?.context?.hawkwingPhysBonus).toBeCloseTo(stacks * 0.018, 12)
    expect(contribution?.context?.bellstrikeAttackPctBonus).toBeCloseTo(stacks * 0.018, 12)
  })

  it("holds no bonus for the event that rolls the stack until it has been observed", () => {
    const setup = setupWith({
      rng: undefined,
      effectiveRates: { precision: 1, critRate: 0, affinityRate: 1 },
    })
    const { mechanic, state } = mechanicAndState(setup)
    const before = mechanic.contributeAt?.(state, 30, undefined, setup)
    mechanic.observeEvent!(state, event("hit", 0.5), setup, NO_HOST)
    const after = mechanic.contributeAt?.(state, 30, undefined, setup)
    expect(before?.context?.hawkwingPhysBonus).toBe(0)
    expect(after?.context?.hawkwingPhysBonus).toBeGreaterThan(0)
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
