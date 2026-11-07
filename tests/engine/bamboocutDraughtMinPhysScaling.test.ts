// Scoped to Bamboocut Draught's Min-Phys-scaled talents (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import {
  inebriateCritDamageBoostAt,
  inebriateSkillCritDamage,
} from "../../src/data/skills/bamboocut-draught/buffs/inebriateSkillCritDamage"
import {
  inebriateDamageBoostAt,
  inebriateDamageScaling,
} from "../../src/data/skills/bamboocut-draught/buffs/inebriateDamageScaling"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"

function inebriateStatus(minPhysAttack: number) {
  return {
    self: { reachesEvent: true },
    status: {
      isActive: (id: string) => id === STATUS.inebriateDeepdaze,
      stacks: () => 0,
    },
    build: { minPhysAttack },
  } as never
}

describe("Inebriate Critical Enhancement's crit-damage bonus", () => {
  it("steps by 2% per full 50 Min Physical Attack, capped at 30% from 750", () => {
    expect(inebriateCritDamageBoostAt(0)).toBe(0)
    expect(inebriateCritDamageBoostAt(49)).toBe(0)
    expect(inebriateCritDamageBoostAt(50)).toBeCloseTo(0.02, 10)
    expect(inebriateCritDamageBoostAt(350)).toBeCloseTo(0.14, 10)
    expect(inebriateCritDamageBoostAt(750)).toBeCloseTo(0.3, 10)
    expect(inebriateCritDamageBoostAt(1500)).toBeCloseTo(0.3, 10)
  })
})

describe("Inebriate DMG Boost Enhancement's damage bonus", () => {
  it("steps by 1% per full 83.33 Min Physical Attack, capped at 9% from 750", () => {
    expect(inebriateDamageBoostAt(0)).toBe(0)
    expect(inebriateDamageBoostAt(83)).toBe(0)
    expect(inebriateDamageBoostAt(250)).toBeCloseTo(0.03, 10)
    expect(inebriateDamageBoostAt(750)).toBeCloseTo(0.09, 10)
    expect(inebriateDamageBoostAt(1500)).toBeCloseTo(0.09, 10)
  })
})

describe("the two Min-Phys-scaled modules read the build's panel stat", () => {
  it("inebriateSkillCritDamage returns the stepped crit-damage bonus while Inebriate", () => {
    const effects = inebriateSkillCritDamage.effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    expect(effects(inebriateStatus(350))).toEqual([
      { kind: "stat", statKey: "critDamageBoost", amount: 0.14 },
    ])
  })

  it("inebriateDamageScaling returns the stepped physBoost and attributeDamageBoost while Inebriate", () => {
    const effects = inebriateDamageScaling.effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    expect(effects(inebriateStatus(250))).toEqual([
      { kind: "stat", statKey: "physBoost", amount: 0.03 },
      { kind: "stat", statKey: "attributeDamageBoost", amount: 0.03 },
    ])
  })
})

describe("paramsFromInputs carries the panel's min physical attack", () => {
  it("reads it from Inputs.phys.min", () => {
    expect(paramsFromInputs(defaultInputs).minPhysAttack).toBe(defaultInputs.phys.min)
  })

  it("a stored buffParams entry of the same key does not shadow the panel value", () => {
    const params = paramsFromInputs({
      ...defaultInputs,
      buffParams: { minPhysAttack: 0 },
    })
    expect(params.minPhysAttack).toBe(defaultInputs.phys.min)
  })
})
