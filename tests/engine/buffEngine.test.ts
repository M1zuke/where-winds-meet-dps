import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffDef } from "../../src/engine/buffs/buffDef"
import { buffDefsForSpec, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("BuffEngine — targeting & triggers", () => {
  it("a buff affects only skills matching its `affects` prefix", () => {
    const defs: BuffDef[] = [
      {
        id: "fanBuff",
        name: "Fan Buff",
        triggeredBy: ["FanHeavy"],
        duration: 10,
        affects: ["FanHeavy"],
        bonus: { type: "buffBonus", value: 0.2 },
      },
    ]
    const e = new BuffEngine({}, defs)
    e.processSkillCast("FanHeavyPursuit", 0, {})
    const fan = e.calculateDamageEffects(taggedSkill("FanHeavyPursuit"), 1)
    const sword = e.calculateDamageEffects(taggedSkill("SwordThrust"), 1)
    expect(fan.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.2 })
    expect(sword.effects).toHaveLength(0)
  })

  it("stacksPerHit ramps up to maxStacks (valuePerStack scales)", () => {
    const defs: BuffDef[] = [
      {
        id: "ramp",
        triggeredBy: ["Multi"],
        duration: 100,
        maxStacks: 3,
        stacksPerHit: true,
        affects: null,
        bonus: { type: "buffBonus", valuePerStack: 0.05 },
      },
    ]
    const e = new BuffEngine({}, defs)
    e.processSkillCast("Multi", 0, { hitCount: 5, duration: 1 })
    const r = e.calculateDamageEffects(taggedSkill("AnySkill"), 1.1)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.15, 6)
  })

  it("rateLimit caps how many times a buff procs in a window", () => {
    const defs: BuffDef[] = [
      {
        id: "capped",
        triggeredBy: ["Hit"],
        duration: 100,
        rateLimit: { count: 2, window: 10 },
        affects: null,
        bonus: { type: "buffBonus", value: 0.1 },
      },
    ]
    const e = new BuffEngine({}, defs)
    for (const t of [0, 1, 2, 3]) e.processSkillCast("Hit", t, {})
    expect(e.isBuffActiveAtTime("capped", 1)).toBe(true)
    expect(e.calculateDamageEffects(taggedSkill("x"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.1,
    })
  })

  it("enabledParam gating: buff is inert when its param is off, active when on", () => {
    const defs: BuffDef[] = [
      {
        id: "gated",
        triggeredBy: ["Cast"],
        duration: 10,
        enabledParam: "myToggle",
        affects: null,
        bonus: { type: "buffBonus", value: 0.3 },
      },
    ]
    const off = new BuffEngine({ myToggle: false }, defs)
    off.processSkillCast("Cast", 0, {})
    expect(off.calculateDamageEffects(taggedSkill("z"), 1).effects).toHaveLength(0)

    const on = new BuffEngine({ myToggle: true }, defs)
    on.processSkillCast("Cast", 0, {})
    expect(on.calculateDamageEffects(taggedSkill("z"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.3,
    })
  })

  it("affectsProperty targets skills carrying the property tag", () => {
    const defs: BuffDef[] = [
      {
        id: "chargeOnly",
        triggeredBy: ["X"],
        duration: 10,
        affectsProperty: "isCharged",
        bonus: { type: "buffBonus", value: 0.25 },
      },
    ]
    const e = new BuffEngine({}, defs)
    e.processSkillCast("X", 0, {})
    const charged = e.calculateDamageEffects(taggedSkill("X", ["prop:isCharged"]), 1)
    const plain = e.calculateDamageEffects(taggedSkill("X"), 1)
    expect(charged.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.25 })
    expect(plain.effects).toHaveLength(0)
  })
})

describe("spec buff data loads", () => {
  it("the umbra spec's buff defs construct an engine without throwing", () => {
    const e = new BuffEngine({}, buffDefsForSpec("bellstrike_umbra"), groupBuffDefs())
    expect(e.definitions.size).toBeGreaterThan(0)
  })
})
