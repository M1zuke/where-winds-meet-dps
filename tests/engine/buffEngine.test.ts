import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffDef } from "../../src/engine/buffs/buffDef"
import { legacyBuffModule } from "../../src/engine/buffs/legacyBuffModule"
import { buffDefsForSpec, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("BuffEngine — targeting & triggers", () => {
  it("a buff reaches only skills declaring the tag its `affects` names", () => {
    const defs: BuffDef[] = [
      {
        id: "fanBuff",
        name: "Fan Buff",
        triggeredBy: ["cast:fanHeavy"],
        duration: 10,
        affects: ["role:fanHeavy"],
        bonus: { type: "buffBonus", value: 0.2 },
      },
    ]
    const engine = new BuffEngine({}, defs.map(legacyBuffModule))
    engine.processSkillCast("cast:fanHeavy", 0, {})
    const fan = engine.calculateDamageEffects(taggedSkill("Fan Heavy", ["role:fanHeavy"]), 1)
    const sword = engine.calculateDamageEffects(taggedSkill("Sword Thrust"), 1)
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
    const engine = new BuffEngine({}, defs.map(legacyBuffModule))
    engine.processSkillCast("Multi", 0, { hitCount: 5, duration: 1 })
    const result = engine.calculateDamageEffects(taggedSkill("AnySkill"), 1.1)
    const total = result.effects
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
    const engine = new BuffEngine({}, defs.map(legacyBuffModule))
    for (const time of [0, 1, 2, 3]) engine.processSkillCast("Hit", time, {})
    expect(engine.isBuffActiveAtTime("capped", 1)).toBe(true)
    expect(engine.calculateDamageEffects(taggedSkill("x"), 1).effects).toContainEqual({
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
    const modules = defs.map(legacyBuffModule)
    const off = new BuffEngine({ myToggle: false }, modules)
    off.processSkillCast("Cast", 0, {})
    expect(off.calculateDamageEffects(taggedSkill("z"), 1).effects).toHaveLength(0)

    const on = new BuffEngine({ myToggle: true }, modules)
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
    const engine = new BuffEngine({}, defs.map(legacyBuffModule))
    engine.processSkillCast("X", 0, {})
    const charged = engine.calculateDamageEffects(taggedSkill("X", ["prop:isCharged"]), 1)
    const plain = engine.calculateDamageEffects(taggedSkill("X"), 1)
    expect(charged.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.25 })
    expect(plain.effects).toHaveLength(0)
  })
})

describe("spec buff data loads", () => {
  it("the umbra spec's buff defs construct an engine without throwing", () => {
    const engine = new BuffEngine({}, buffDefsForSpec("bellstrike_umbra"), groupBuffDefs())
    expect(engine.definitions.size).toBeGreaterThan(0)
  })
})
