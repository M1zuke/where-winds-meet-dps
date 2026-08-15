import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { BUFF } from "../../src/data/skills/buffs/ids"

function tagged(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("activeAfterBuffEnds — resistanceResolve (global) off rainwhisperShield (global)", () => {
  const params = { artOfResistance: true, artOfResistanceTier: 6 }

  it("is active only in the window after the source buff ends, not before or long after", () => {
    const engine = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    const skill = tagged("AnySkill")
    expect(engine.calculateDamageEffects(skill, 4).breakdown.resistanceResolve).toBeUndefined()
    expect(engine.calculateDamageEffects(skill, 8).breakdown.resistanceResolve).toBe(0.1)
    expect(engine.calculateDamageEffects(skill, 19.9).breakdown.resistanceResolve).toBe(0.1)
    expect(engine.calculateDamageEffects(skill, 20.1).breakdown.resistanceResolve).toBeUndefined()
  })

  it("computes the 12-second branch from a goldenBody-cancel cast, not just the 8-second default", () => {
    const engine = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    engine.processSkillCast("cast:goldenBodyCancel", 0, {}, false, [BUFF.rainwhisperShield])
    const skill = tagged("AnySkill")
    expect(engine.calculateDamageEffects(skill, 11.5).breakdown.resistanceResolve).toBeUndefined()
    expect(engine.calculateDamageEffects(skill, 12.5).breakdown.resistanceResolve).toBe(0.1)
  })

  it("is cancelled by a reapply of the source buff before the window would have ended", () => {
    const engine = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    engine.processSkillCast("cast:probe", 10, {}, false, [BUFF.rainwhisperShield])
    const skill = tagged("AnySkill")
    expect(engine.calculateDamageEffects(skill, 9).breakdown.resistanceResolve).toBe(0.1)
    expect(engine.calculateDamageEffects(skill, 11).breakdown.resistanceResolve).toBeUndefined()
    expect(engine.calculateDamageEffects(skill, 18).breakdown.resistanceResolve).toBe(0.1)
  })

  it("a routine refresh BEFORE the source buff would have expired doesn't spuriously activate the end-triggered buff", () => {
    const engine = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    engine.processSkillCast("cast:probe", 5, {}, false, [BUFF.rainwhisperShield])
    const skill = tagged("AnySkill")
    expect(engine.calculateDamageEffects(skill, 8.5).breakdown.resistanceResolve).toBeUndefined()
    expect(engine.calculateDamageEffects(skill, 13).breakdown.resistanceResolve).toBe(0.1)
  })

  it("is inert without artOfResistance tier 6", () => {
    const engine = new BuffEngine({}, allBuffDefsDeduped(), groupBuffDefs())
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    expect(
      engine.calculateDamageEffects(tagged("AnySkill"), 8).breakdown.resistanceResolve,
    ).toBeUndefined()
  })
})
