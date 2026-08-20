import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SET_ID } from "../../src/data/sets/ids"

const LIGHT_RECEIVES = [BUFF.mistwillowHeavyBuff, BUFF.mistwillowBuff]
const HEAVY_RECEIVES = [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff]
const MIXED_RECEIVES = [BUFF.mistwillowHeavyBuff, BUFF.mistwillowLightBuff, BUFF.mistwillowBuff]

function engine(armorSet?: string) {
  return new BuffEngine(armorSet ? { armorSet } : {}, GLOBAL_BUFF_DEFS, [])
}
function lightProbe(name: string) {
  return makeSkill("test", { name, tags: ["attack:light"], receives: LIGHT_RECEIVES })
}
function heavyProbe(name: string) {
  return makeSkill("test", { name, tags: ["attack:heavy"], receives: HEAVY_RECEIVES })
}
function mixedProbe(name: string) {
  return makeSkill("test", { name, tags: ["attack:mixed"], receives: MIXED_RECEIVES })
}

describe("mistwillow — BuffEngine", () => {
  it("a heavy cast grants the heavy stance; a subsequent light hit then gets +10% phys and attribute damage", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    const r = e.calculateDamageEffects(lightProbe("SomeLightHit"), 0.1)
    expect(r.effects).toContainEqual({ statKey: "physBoost", amount: 0.1 })
    expect(r.effects).toContainEqual({ statKey: "attributeDamageBoost", amount: 0.1 })
    expect(r.breakdown[BUFF.mistwillowHeavyBuff]).toBeCloseTo(0.2, 10)
  })

  it("a light cast grants the light stance; a subsequent HEAVY hit gets the bonus (cross-synergy, not same-stance)", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeLightHit", 0, { attackType: "light" })
    const afterHeavy = e.calculateDamageEffects(heavyProbe("SomeHeavyHit"), 0.1)
    expect(afterHeavy.breakdown[BUFF.mistwillowLightBuff]).toBeCloseTo(0.2, 10)
    const afterLight = e.calculateDamageEffects(lightProbe("AnotherLightHit"), 0.1)
    expect(afterLight.breakdown[BUFF.mistwillowHeavyBuff]).toBeUndefined()
    expect(afterLight.breakdown[BUFF.mistwillowBuff]).toBeUndefined()
  })

  it("is inert without the mistwillow set", () => {
    const e = engine()
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    const r = e.calculateDamageEffects(lightProbe("SomeLightHit"), 0.1)
    expect(r.breakdown[BUFF.mistwillowHeavyBuff]).toBeUndefined()
  })

  it("a cast tag alone grants no stance — only attack: tags and prop:isExecution classify a cast", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("cast:umbQ", 0, {})
    const r = e.calculateDamageEffects(heavyProbe("SomeHeavyHit"), 0.1)
    expect(r.breakdown[BUFF.mistwillowLightBuff]).toBeUndefined()
  })

  it("an isExecution-flagged cast grants the heavy stance even without attack:heavy", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeExecutionHit", 0, { isExecution: true })
    const r = e.calculateDamageEffects(lightProbe("SomeLightHit"), 0.1)
    expect(r.breakdown[BUFF.mistwillowHeavyBuff]).toBeCloseTo(0.2, 10)
  })

  it("a mixed hit under a single stance gets half the bonus", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    const r = e.calculateDamageEffects(mixedProbe("SomeMixedHit"), 0.1)
    expect(r.effects).toContainEqual({ statKey: "physBoost", amount: 0.05 })
    expect(r.effects).toContainEqual({ statKey: "attributeDamageBoost", amount: 0.05 })
    expect(r.breakdown[BUFF.mistwillowHeavyBuff]).toBeCloseTo(0.1, 10)
  })

  it("a mixed cast lands both bonuses at once, so it upgrades straight to the merged Mistwillow (full 10%)", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeMixedHit", 0, { attackType: "mixed" })
    expect(e.isBuffActiveAtTime(BUFF.mistwillowBuff, 0.1)).toBe(true)
    const r = e.calculateDamageEffects(mixedProbe("AnotherMixedHit"), 0.1)
    expect(r.effects).toContainEqual({ statKey: "physBoost", amount: 0.1 })
    expect(r.breakdown[BUFF.mistwillowBuff]).toBeCloseTo(0.2, 10)
  })

  it("when both bonuses exist they upgrade to Mistwillow, which buffs both stances beyond the singles' staggered expiries", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    e.processSkillCast("SomeLightHit", 14, { attackType: "light" })
    expect(
      e.calculateDamageEffects(lightProbe("AnotherLightHit"), 20).breakdown[BUFF.mistwillowBuff],
    ).toBeCloseTo(0.2, 10)
    expect(
      e.calculateDamageEffects(heavyProbe("AnotherHeavyHit"), 20).breakdown[BUFF.mistwillowBuff],
    ).toBeCloseTo(0.2, 10)
  })

  it("the single stances end the moment they upgrade to the merged buff", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeHeavyHit", 0, { attackType: "heavy" })
    e.processSkillCast("SomeLightHit", 5, { attackType: "light" })
    expect(e.isBuffActiveAtTime(BUFF.mistwillowBuff, 6)).toBe(true)
    expect(e.isBuffActiveAtTime(BUFF.mistwillowHeavyBuff, 6)).toBe(false)
    expect(e.isBuffActiveAtTime(BUFF.mistwillowLightBuff, 6)).toBe(false)
  })

  it("any corresponding hit refreshes the merged Mistwillow's shared duration", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeMixedHit", 0, { attackType: "mixed" })
    e.processSkillCast("SomeHeavyHit", 10, { attackType: "heavy" })
    expect(
      e.calculateDamageEffects(lightProbe("SomeLightHit"), 20).breakdown[BUFF.mistwillowBuff],
    ).toBeCloseTo(0.2, 10)
  })

  it("a refresh within 2 seconds of the last application is skipped", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeMixedHit", 0, { attackType: "mixed" })
    e.processSkillCast("AnotherMixedHit", 1, { attackType: "mixed" })
    const r = e.calculateDamageEffects(mixedProbe("ProbeMixedHit"), 15.5)
    expect(r.breakdown[BUFF.mistwillowBuff]).toBeUndefined()
  })

  it("a refresh 2 seconds or more after the last application extends the duration", () => {
    const e = engine(SET_ID.mistwillow)
    e.processSkillCast("SomeMixedHit", 0, { attackType: "mixed" })
    e.processSkillCast("AnotherMixedHit", 2.5, { attackType: "mixed" })
    const r = e.calculateDamageEffects(mixedProbe("ProbeMixedHit"), 16)
    expect(r.breakdown[BUFF.mistwillowBuff]).toBeCloseTo(0.2, 10)
  })

  it("the 2-second throttle also gates a single stance's refresh", () => {
    const throttled = engine(SET_ID.mistwillow)
    throttled.processSkillCast("SomeLightHit", 0, { attackType: "light" })
    throttled.processSkillCast("AnotherLightHit", 1, { attackType: "light" })
    expect(
      throttled.calculateDamageEffects(heavyProbe("SomeHeavyHit"), 15.5).breakdown[
        BUFF.mistwillowLightBuff
      ],
    ).toBeUndefined()

    const refreshed = engine(SET_ID.mistwillow)
    refreshed.processSkillCast("SomeLightHit", 0, { attackType: "light" })
    refreshed.processSkillCast("AnotherLightHit", 3, { attackType: "light" })
    expect(
      refreshed.calculateDamageEffects(heavyProbe("SomeHeavyHit"), 15.5).breakdown[
        BUFF.mistwillowLightBuff
      ],
    ).toBeCloseTo(0.2, 10)
  })
})

describe("mistwillow — Skill Editor catalog", () => {
  it("a light skill's Receives rows list the heavy stance and the merged Mistwillow, not the light stance", () => {
    const rows = receivesForSkill(lightProbe("SomeLightHit"))
    const ids = rows.map((row) => row.id)
    expect(ids).toContain(BUFF.mistwillowHeavyBuff)
    expect(ids).toContain(BUFF.mistwillowBuff)
    expect(ids).not.toContain(BUFF.mistwillowLightBuff)
  })

  it("a heavy skill's Receives rows list the light stance and the merged Mistwillow", () => {
    const rows = receivesForSkill(heavyProbe("SomeHeavyHit"))
    const ids = rows.map((row) => row.id)
    expect(ids).toContain(BUFF.mistwillowLightBuff)
    expect(ids).toContain(BUFF.mistwillowBuff)
    expect(ids).not.toContain(BUFF.mistwillowHeavyBuff)
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
