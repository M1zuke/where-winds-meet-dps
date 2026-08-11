import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("BuffEngine — targeting & triggers", () => {
  it("a buff reaches only skills declaring the tag its `affects` names", () => {
    const modules: BuffModule[] = [
      {
        id: "fanBuff",
        name: "Fan Buff",
        triggeredBy: ["cast:fanHeavy"],
        duration: 10,
        affects: ["role:fanHeavy"],
        effects: [stat("allDamageBoost", 0.2)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("cast:fanHeavy", 0, {})
    const fan = engine.calculateDamageEffects(taggedSkill("Fan Heavy", ["role:fanHeavy"]), 1)
    const sword = engine.calculateDamageEffects(taggedSkill("Sword Thrust"), 1)
    expect(fan.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.2 })
    expect(sword.effects).toHaveLength(0)
  })

  it("stacksPerHit ramps up to maxStacks (per-stack scaling)", () => {
    const modules: BuffModule[] = [
      {
        id: "ramp",
        name: "Ramp",
        triggeredBy: ["Multi"],
        duration: 100,
        maxStacks: 3,
        stacksPerHit: true,
        affects: null,
        summary: "test",
        effects: (ctx) => [stat("allDamageBoost", 0.05 * ctx.self.stacks)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("Multi", 0, { hitCount: 5, duration: 1 })
    const result = engine.calculateDamageEffects(taggedSkill("AnySkill"), 1.1)
    const total = result.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.15, 6)
  })

  it("rateLimit caps how many times a buff procs in a window", () => {
    const modules: BuffModule[] = [
      {
        id: "capped",
        name: "Capped",
        triggeredBy: ["Hit"],
        duration: 100,
        rateLimit: { count: 2, window: 10 },
        affects: null,
        effects: [stat("allDamageBoost", 0.1)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    for (const time of [0, 1, 2, 3]) engine.processSkillCast("Hit", time, {})
    expect(engine.isBuffActiveAtTime("capped", 1)).toBe(true)
    expect(engine.calculateDamageEffects(taggedSkill("x"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.1,
    })
  })

  it("enabledParam gating: buff is inert when its param is off, active when on", () => {
    const modules: BuffModule[] = [
      {
        id: "gated",
        name: "Gated",
        triggeredBy: ["Cast"],
        duration: 10,
        requires: { param: "myToggle" },
        affects: null,
        effects: [stat("allDamageBoost", 0.3)],
      },
    ]
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
    const modules: BuffModule[] = [
      {
        id: "chargeOnly",
        name: "Charge Only",
        triggeredBy: ["X"],
        duration: 10,
        affectsProperty: "isCharged",
        effects: [stat("allDamageBoost", 0.25)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("X", 0, {})
    const charged = engine.calculateDamageEffects(taggedSkill("X", ["prop:isCharged"]), 1)
    const plain = engine.calculateDamageEffects(taggedSkill("X"), 1)
    expect(charged.effects).toContainEqual({ statKey: "allDamageBoost", amount: 0.25 })
    expect(plain.effects).toHaveLength(0)
  })
})

describe("class buff data loads", () => {
  it("bellstrikeUmbra's buff defs construct an engine without throwing", () => {
    const engine = new BuffEngine({}, buffDefsForClass("bellstrikeUmbra"), groupBuffDefs())
    expect(engine.definitions.size).toBeGreaterThan(0)
  })
})
