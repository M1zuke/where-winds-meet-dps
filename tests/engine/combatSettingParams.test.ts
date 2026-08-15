// The counterpart to `buildEnablement.test.ts`: a few buffs are gated on a
// Combat Settings toggle rather than on the build, for states the simulation
// cannot derive. The toggle is global; the def it gates need not be.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { BUFF } from "../../src/data/skills/buffs/ids"

describe("Below 60% Endurance", () => {
  it("takes its param from the setting alone", () => {
    const settings = { ...defaultCombatSettings(), lowEndurance: true }
    expect(paramsFromInputs({ ...defaultInputs, combatSettings: settings }).lowEndurance).toBe(true)
  })

  it("is off unless the setting says otherwise", () => {
    expect(defaultCombatSettings().lowEndurance).toBe(false)
    expect(paramsFromInputs({ ...defaultInputs }).lowEndurance).toBeUndefined()
  })

  it("is offered to the class that owns it and to no other", () => {
    const owners = CLASS_IDS().filter((classId) =>
      buffDefsForClass(classId).some((def) => def.id === BUFF.belowSixtyEndurance),
    )
    expect(owners).toEqual(["bellstrikeSplendor"])
  })
})

// Ladder from the in-game tier panel: tier 0 grants the charged-skill bonus at
// 10%, tier 4 raises it to 15%, and tier 6 adds the Endurance-consumed 10% on
// top — which is how the reference workbook's 25% at tier 6 decomposes.
describe("Battle Anthem's tiers", () => {
  const defOf = (id: string) => buffDefsForClass("bellstrikeSplendor").find((d) => d.id === id)!
  const boostAt = (tier: number) => {
    const effects = defOf(BUFF.battleAnthemChargedDamage).effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    return effects({
      self: { reachesEvent: true },
      build: { paramTier: () => tier },
    } as never)[0]
  }

  it("raises the charged-skill bonus at tier 4", () => {
    expect(boostAt(3)).toEqual({ kind: "stat", statKey: "allDamageBoost", amount: 0.1 })
    expect(boostAt(4)).toEqual({ kind: "stat", statKey: "allDamageBoost", amount: 0.15 })
    expect(boostAt(6)).toEqual({ kind: "stat", statKey: "allDamageBoost", amount: 0.15 })
  })

  it("keeps the Endurance-consumed bonus to tier 6", () => {
    expect(defOf(BUFF.battleAnthemEnduranceBoost).requires).toEqual({
      param: "battleAnthem",
      minTier: 6,
    })
  })

  it("reaches the workbook's 25% only at tier 6", () => {
    const charged = (boostAt(6) as { amount: number }).amount
    expect(charged + 0.1).toBeCloseTo(0.25, 10)
  })
})
