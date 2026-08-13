import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function tagged(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("activeAfterBuffEnds — resistanceResolve (global) off rainwhisperShield (global)", () => {
  const params = { artOfResistance: true, artOfResistanceTier: 6 }

  it("is active only in the window after the source buff ends, not before or long after", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("cast:moBladeQ", 0, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 4).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 8).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 19.9).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 20.1).breakdown.resistanceResolve).toBeUndefined()
  })

  it("is cancelled by a reapply of the source buff before the window would have ended", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("cast:moBladeQ", 0, {})
    e.processSkillCast("cast:moBladeQ", 10, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 9).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 11).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 18).breakdown.resistanceResolve).toBe(0.1)
  })

  it("a routine refresh BEFORE the source buff would have expired doesn't spuriously activate the end-triggered buff", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("cast:moBladeQ", 0, {})
    e.processSkillCast("cast:moBladeQ", 5, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 8.5).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 13).breakdown.resistanceResolve).toBe(0.1)
  })

  it("is inert without artOfResistance tier 6", () => {
    const e = new BuffEngine({}, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("cast:moBladeQ", 0, {})
    expect(
      e.calculateDamageEffects(tagged("AnySkill"), 8).breakdown.resistanceResolve,
    ).toBeUndefined()
  })
})
