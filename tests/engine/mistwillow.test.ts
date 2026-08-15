import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"
import { SET_ID } from "../../src/data/sets/ids"

function tagged(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("mistwillow — BuffEngine", () => {
  it("a heavy cast grants the heavy stance; a subsequent light hit then gets +10% all-damage", () => {
    const e = new BuffEngine({ armorSet: "mistwillow" }, [], [])
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    const lightHit = tagged("SomeLightHit", ["attack:light"])
    const r = e.calculateDamageEffects(lightHit, 0.1)
    expect(r.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.1 })
    expect(r.breakdown.mistwillow).toBe(0.1)
  })

  it("a light cast grants the light stance; a subsequent HEAVY hit gets the bonus (cross-synergy, not same-stance)", () => {
    const e = new BuffEngine({ armorSet: "mistwillow" }, [], [])
    e.processSkillCast("SomeLightHit", 0, { attackType: "light" })
    const heavyHit = tagged("SomeHeavyHit", ["attack:heavy"])
    expect(e.calculateDamageEffects(heavyHit, 0.1).breakdown.mistwillow).toBe(0.1)
    const anotherLightHit = tagged("AnotherLightHit", ["attack:light"])
    expect(e.calculateDamageEffects(anotherLightHit, 0.1).breakdown.mistwillow).toBeUndefined()
  })

  it("is inert without the mistwillow set", () => {
    const e = new BuffEngine({}, [], [])
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    const lightHit = tagged("SomeLightHit", ["attack:light"])
    expect(e.calculateDamageEffects(lightHit, 0.1).breakdown.mistwillow).toBeUndefined()
  })

  it("a cast tag alone grants no stance — only attack: tags and prop:isExecution classify a cast", () => {
    const e = new BuffEngine({ armorSet: "mistwillow" }, [], [])
    e.processSkillCast("cast:umbQ", 0, {})
    const heavyHit = tagged("SomeHeavyHit", ["attack:heavy"])
    expect(e.calculateDamageEffects(heavyHit, 0.1).breakdown.mistwillow).toBeUndefined()
  })

  it("an isExecution-flagged cast grants the heavy stance even without attack:heavy", () => {
    const e = new BuffEngine({ armorSet: "mistwillow" }, [], [])
    e.processSkillCast("SomeExecutionHit", 0, { isExecution: true })
    const lightHit = tagged("SomeLightHit", ["attack:light"])
    expect(e.calculateDamageEffects(lightHit, 0.1).breakdown.mistwillow).toBe(0.1)
  })

  it("a mixed cast grants BOTH stances (a subsequent mixed hit gets the full 10%, split 5/5 by the default ratio)", () => {
    const e = new BuffEngine({ armorSet: "mistwillow" }, [], [])
    e.processSkillCast("SomeMixedHit", 0, { attackType: "mixed" })
    const mixedHit = tagged("AnotherMixedHit", ["attack:mixed"])
    expect(e.calculateDamageEffects(mixedHit, 0.1).breakdown.mistwillow).toBeCloseTo(0.1, 10)
  })
})

describe("mistwillow — end to end through simulateTimeline", () => {
  it("selecting Mistwillow changes DPS relative to no set, without crashing", () => {
    const rotation = defaultRotationForClass("bellstrikeUmbra")!
    const without: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const withMistwillow: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      set: SET_ID.mistwillow,
    }
    const before = simulateTimeline(without)
    const after = simulateTimeline(withMistwillow)
    expect(before.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
    expect(after.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
    expect(after.dps).toBeGreaterThan(0)
    expect(after.dps).not.toBeCloseTo(before.dps, 3)
  })
})
