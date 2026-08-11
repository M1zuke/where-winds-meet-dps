import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForSpec, allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function tagged(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("perCastConsume — frostCladSnowbreakIPConsume (stonesplit_strength)", () => {
  const params = { frostCladNight: true, frostCladNightTier: 6 }

  it("grants exactly +40%, not +80%, when consumption and qi break are both true", () => {
    const e = new BuffEngine(
      { ...params, qiBreakTime: 1, bossBreakDuration: 10 },
      buffDefsForSpec("stonesplit_strength"),
      groupBuffDefs(),
    )
    e.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    expect(e.getHistoricalBuffStacks("innerPassion", 1.01)).toBe(4)

    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    expect(e.calculateDamageEffects(vc, 1.05).breakdown.frostCladSnowbreakIPConsume).toBe(0.4)

    e.processSkillCast("SnowpartingVC", 1.05, { consumesInnerPassion: true })
    const r = e.calculateDamageEffects(vc, 1.05)
    expect(r.effects).toContainEqual({ statKey: "bossBoost", amount: 0.4 })
    expect(r.breakdown.frostCladSnowbreakIPConsume).toBe(0.4)
    expect(
      r.effects
        .filter((effect) => effect.statKey === "bossBoost")
        .reduce((total, effect) => total + effect.amount, 0),
    ).toBe(0.4)

    expect(e.getHistoricalBuffStacks("innerPassion", 1.06)).toBe(3)
    expect(e.calculateDamageEffects(vc, 1.06).breakdown.frostCladSnowbreakIPConsume).toBe(0.4)
  })

  it("grants +40% when SnowpartingVC consumes Inner Passion outside qi break", () => {
    const e = new BuffEngine(params, buffDefsForSpec("stonesplit_strength"), groupBuffDefs())
    e.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    e.processSkillCast("SnowpartingVC", 1.05, { consumesInnerPassion: true })

    expect(e.getHistoricalBuffStacks("innerPassion", 1.06)).toBe(3)
    expect(e.calculateDamageEffects(vc, 1.05).breakdown.frostCladSnowbreakIPConsume).toBe(0.4)
    expect(e.calculateDamageEffects(vc, 1.06).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()
  })

  it("uses qi break as the alternative condition when Inner Passion is absent", () => {
    for (const qiBreakTime of [0, 25]) {
      const e = new BuffEngine(
        { ...params, qiBreakTime, bossBreakDuration: 10 },
        buffDefsForSpec("stonesplit_strength"),
        groupBuffDefs(),
      )
      const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
      e.processSkillCast("SnowpartingVC", 0.05, { consumesInnerPassion: true })
      const effect = e.calculateDamageEffects(vc, 0.05).breakdown.frostCladSnowbreakIPConsume
      if (qiBreakTime === 0) expect(effect).toBe(0.4)
      else expect(effect).toBeUndefined()
    }
  })

  it("does not apply the qi-break fallback to skills other than SnowpartingVC", () => {
    const e = new BuffEngine(
      { ...params, qiBreakTime: 0, bossBreakDuration: 10 },
      buffDefsForSpec("stonesplit_strength"),
      groupBuffDefs(),
    )
    expect(
      e.calculateDamageEffects(tagged("SnowpartingSpecial"), 0.05).breakdown
        .frostCladSnowbreakIPConsume,
    ).toBeUndefined()
  })

  it("keeps the qi-break alternative at tier 6 while tier 4 consumption still grants 40%", () => {
    const e = new BuffEngine(
      { frostCladNight: true, frostCladNightTier: 4, qiBreakTime: 0, bossBreakDuration: 10 },
      buffDefsForSpec("stonesplit_strength"),
      groupBuffDefs(),
    )
    const vc = tagged("SnowpartingVC", ["prop:consumesInnerPassion"])
    expect(e.calculateDamageEffects(vc, 0.05).breakdown.frostCladSnowbreakIPConsume).toBeUndefined()

    e.processSkillCast("SnowpartingSpecial", 0.1, { castTime: 1 })
    e.processSkillCast("SnowpartingVC", 1.15, { consumesInnerPassion: true })
    expect(e.calculateDamageEffects(vc, 1.15).breakdown.frostCladSnowbreakIPConsume).toBe(0.4)
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

describe("SnowpartingVC exhausted bonus registration (stonesplit_strength)", () => {
  it("does not register a standalone exhausted SnowpartingVC bonus", () => {
    expect(
      buffDefsForSpec("stonesplit_strength").some(
        (def) => def.id === "frostCladSnowbreakT6Exhausted",
      ),
    ).toBe(false)
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
