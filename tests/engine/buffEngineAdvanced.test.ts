import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForSpec, allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function tagged(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("perCastConsume — frostCladSnowbreakIPConsume (stonesplit_strength)", () => {
  const params = { frostCladNight: true, frostCladNightTier: 6 }

  it("grants +40% boss-boost on the SnowpartingVC cast that consumes an Inner Passion stack, and only that cast", () => {
    const e = new BuffEngine(params, buffDefsForSpec("stonesplit_strength"), groupBuffDefs())
    e.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    expect(e.getHistoricalBuffStacks("innerPassion", 1.01)).toBe(4)

    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    expect(e.calculateDamageEffects(vc, 1.05).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()

    e.processSkillCast("SnowpartingVC", 1.05, { consumesInnerPassion: true })
    const r = e.calculateDamageEffects(vc, 1.05)
    expect(r.effects).toContainEqual({ statKey: "bossBoost", amount: 0.4 })
    expect(r.breakdown.frostCladSnowbreakIPConsume).toBe(0.4)

    expect(e.getHistoricalBuffStacks("innerPassion", 1.06)).toBe(3)
    expect(e.calculateDamageEffects(vc, 1.06).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()
  })

  it("grants nothing when there is no Inner Passion stack to consume", () => {
    const e = new BuffEngine(params, buffDefsForSpec("stonesplit_strength"), groupBuffDefs())
    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    e.processSkillCast("SnowpartingVC", 0, { consumesInnerPassion: true })
    expect(e.calculateDamageEffects(vc, 0).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()
  })

  it("is inert without frostCladNight tier 4+ (enabledParam/minTier gate)", () => {
    const e = new BuffEngine({}, buffDefsForSpec("stonesplit_strength"), groupBuffDefs())
    e.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    expect(e.getHistoricalBuffStacks("innerPassion", 1.01)).toBe(1)
    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    e.processSkillCast("SnowpartingVC", 1.05, { consumesInnerPassion: true })
    expect(e.calculateDamageEffects(vc, 1.05).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()
    expect(e.getHistoricalBuffStacks("innerPassion", 1.06)).toBe(1)
  })
})

describe("triggerOnBuffEnd — resistanceResolve (global) off rainwhisperShield (global)", () => {
  const params = { artOfResistance: true, artOfResistanceTier: 6 }

  it("is active only in the window after the source buff ends, not before or long after", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("MoBladeQ", 0, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 4).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 8).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 19.9).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 20.1).breakdown.resistanceResolve).toBeUndefined()
  })

  it("is cancelled by a reapply of the source buff before the window would have ended", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("MoBladeQ", 0, {})
    e.processSkillCast("MoBladeQ", 10, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 9).breakdown.resistanceResolve).toBe(0.1)
    expect(e.calculateDamageEffects(skill, 11).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 18).breakdown.resistanceResolve).toBe(0.1)
  })

  it("a routine refresh BEFORE the source buff would have expired doesn't spuriously activate the end-triggered buff", () => {
    const e = new BuffEngine(params, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("MoBladeQ", 0, {})
    e.processSkillCast("MoBladeQ", 5, {})
    const skill = tagged("AnySkill")
    expect(e.calculateDamageEffects(skill, 8.5).breakdown.resistanceResolve).toBeUndefined()
    expect(e.calculateDamageEffects(skill, 13).breakdown.resistanceResolve).toBe(0.1)
  })

  it("is inert without artOfResistance tier 6", () => {
    const e = new BuffEngine({}, allBuffDefsDeduped(), groupBuffDefs())
    e.processSkillCast("MoBladeQ", 0, {})
    expect(
      e.calculateDamageEffects(tagged("AnySkill"), 8).breakdown.resistanceResolve,
    ).toBeUndefined()
  })
})

describe("phaseGate — frostCladSnowbreakT6Exhausted (stonesplit_strength)", () => {
  it("only contributes its boss-boost while the qi phase is 'exhausted'", () => {
    const params = {
      frostCladNight: true,
      frostCladNightTier: 6,
      qiBreakTime: 25,
      bossBreakDuration: 10,
    }
    const e = new BuffEngine(params, buffDefsForSpec("stonesplit_strength"), groupBuffDefs())
    const snowpartingVC = tagged("probe", ["role:snowpartingVC"])
    expect(
      e.calculateDamageEffects(snowpartingVC, 10).breakdown.frostCladSnowbreakT6Exhausted,
    ).toBeUndefined()
    expect(
      e.calculateDamageEffects(snowpartingVC, 30).breakdown.frostCladSnowbreakT6Exhausted,
    ).toBe(0.4)
    expect(
      e.calculateDamageEffects(snowpartingVC, 40).breakdown.frostCladSnowbreakT6Exhausted,
    ).toBeUndefined()
  })
})

describe("consumableStackPool — springThunder (bellstrike_splendor)", () => {
  it("fills on stackOn, and never consumes without a mistwillowCategory opt wired (documented gap)", () => {
    const params = { thunderousBloom: true }
    const e = new BuffEngine(params, buffDefsForSpec("bellstrike_splendor"), groupBuffDefs())
    e.processSkillCast("AnyMartialQ", 0, { isMartialSkillQ: true })
    e.processSkillCast("AnyLightHit", 1, {})
    const r = e.calculateDamageEffects(tagged("AnyLightHit"), 1)
    expect(r.breakdown.springThunder).toBeUndefined()
  })

  it("generic mechanism: fills (rate/icd-limited, capped) and drains + grants its bonus on a resolvable consumeOn", () => {
    const defs = [
      {
        id: "testPool",
        name: "Test Pool",
        triggers: [],
        duration: 0,
        affects: null,
        bonus: null,
        consumableStackPool: {
          stackOn: { skillProperty: "fillsPool", stacksPerTrigger: 2, icd: 1 },
          stackCap: 5,
          stackLifetime: 10,
          consumeOn: { skillProperty: "drainsPool" },
          bonus: { type: "bossOnlyBuffBonus" as const, value: 0.2 },
        },
      },
    ]
    const e = new BuffEngine({}, defs, [])
    e.processSkillCast("Fill", 0, { fillsPool: true })
    e.processSkillCast("Fill", 0.5, { fillsPool: true })
    e.processSkillCast("Fill", 2, { fillsPool: true })
    e.processSkillCast("Drain", 3, { drainsPool: true })
    const r = e.calculateDamageEffects(tagged("Drain"), 3)
    expect(r.effects).toContainEqual({ statKey: "bossBoost", amount: 0.2 })
    e.processSkillCast("Drain", 4, { drainsPool: true })
    expect(e.calculateDamageEffects(tagged("Drain"), 4).effects).toHaveLength(0)
  })
})
