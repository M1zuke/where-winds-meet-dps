import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { makeSkill } from "../../src/engine/skill"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

describe("BuffEngine — targeting & triggers", () => {
  it("stacksPerHit ramps up to maxStacks (per-stack scaling)", () => {
    const modules: BuffModule[] = [
      {
        id: "ramp",
        name: "Ramp",
        duration: 100,
        maxStacks: 3,
        stacksPerHit: true,
        affectsAll: true,
        summary: "test",
        effects: (ctx) => [stat("allDamageBoost", 0.05 * ctx.self.stacks)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("Multi", 0, { hitCount: 5, duration: 1 }, false, ["ramp"])
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
        duration: 100,
        rateLimit: { count: 2, window: 10 },
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.1)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    for (const time of [0, 1, 2, 3]) engine.processSkillCast("Hit", time, {}, false, ["capped"])
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
        duration: 10,
        requires: { param: "myToggle" },
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.3)],
      },
    ]
    const off = new BuffEngine({ myToggle: false }, modules)
    off.processSkillCast("Cast", 0, {}, false, ["gated"])
    expect(off.calculateDamageEffects(taggedSkill("z"), 1).effects).toHaveLength(0)

    const on = new BuffEngine({ myToggle: true }, modules)
    on.processSkillCast("Cast", 0, {}, false, ["gated"])
    expect(on.calculateDamageEffects(taggedSkill("z"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.3,
    })
  })

  it("a scoped buff (no affectsAll) reaches only a skill whose own receives lists it", () => {
    const modules: BuffModule[] = [
      {
        id: "receivedBuff",
        name: "Received Buff",
        duration: 10,
        alwaysActive: true,
        effects: [stat("allDamageBoost", 0.4)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    const listed = makeSkill("test", { name: "Listed", receives: ["receivedBuff"] })
    const unlisted = makeSkill("test", { name: "Unlisted" })
    expect(engine.calculateDamageEffects(listed, 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.4,
    })
    expect(engine.calculateDamageEffects(unlisted, 1).effects).toHaveLength(0)
  })

  it("a skill's own `triggersBuffs` is the only trigger channel a buff needs", () => {
    const modules: BuffModule[] = [
      {
        id: "declaredTrigger",
        name: "Declared Trigger",
        duration: 10,
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.5)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("cast:something", 0, {}, false, ["declaredTrigger"])
    expect(engine.calculateDamageEffects(taggedSkill("Anything"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.5,
    })
  })

  it("hands a module reachesEvent: false on a non-damage event, true on a damage event its scope matches", () => {
    const modules: BuffModule[] = [
      {
        id: "reachesEventProbe",
        name: "ReachesEvent Probe",
        alwaysActive: true,
        affectsAll: true,
        duration: 10,
        summary: "test",
        effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.1)] : []),
      },
    ]
    const engine = new BuffEngine({}, modules)
    const [displayed] = engine.activeBuffsForDisplay(1)
    expect(displayed.effects).toHaveLength(0)
    expect(engine.calculateDamageEffects(taggedSkill("Anything"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.1,
    })
  })

  it("a buff id repeated in the declared list fires only once", () => {
    const modules: BuffModule[] = [
      {
        id: "bothChannels",
        name: "Both Channels",
        duration: 10,
        maxStacks: 5,
        stacksPerHit: false,
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.1)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.processSkillCast("cast:both", 0, {}, false, ["bothChannels", "bothChannels"])
    expect(engine.getHistoricalBuffStacks("bothChannels", 0)).toBe(1)
  })
})

describe("BuffEngine — triggerDeclaredBuffs (the DoT-tick trigger path)", () => {
  it("applies a declared buff the same way processSkillCast's declared path would", () => {
    const modules: BuffModule[] = [
      {
        id: "tickDeclared",
        name: "Tick Declared",
        duration: 10,
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.2)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.triggerDeclaredBuffs(["tickDeclared"], "dot:probe", 0)
    expect(engine.calculateDamageEffects(taggedSkill("Any"), 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.2,
    })
  })

  it("gates a declared trigger with a cooldown exactly as a cast is gated", () => {
    const modules: BuffModule[] = [
      {
        id: "coolingTick",
        name: "Cooling Tick",
        duration: 5,
        cooldown: 10,
        affectsAll: true,
        effects: [stat("allDamageBoost", 0.1)],
      },
    ]
    const engine = new BuffEngine({}, modules)
    engine.triggerDeclaredBuffs(["coolingTick"], "dot:probe", 0)
    engine.triggerDeclaredBuffs(["coolingTick"], "dot:probe", 2)
    expect(engine.isBuffActiveAtTime("coolingTick", 6)).toBe(false)
  })

  it("does not run per-cast consume — a pool a cast would spend stays untouched", () => {
    const pool: BuffModule = {
      id: "tickPool",
      name: "Pool",
      duration: 999,
      seedAtStart: true,
      effects: [],
    }
    const consumer: BuffModule = {
      id: "tickConsumer",
      name: "Consumer",
      duration: 10,
      affectsAll: true,
      perCastConsume: { property: "consumesInnerPassion", from: "tickPool" },
      effects: [],
    }
    const viaCast = new BuffEngine({}, [pool, consumer])
    viaCast.processSkillCast("cast:probe", 0, { consumesInnerPassion: true })
    expect(viaCast.getHistoricalBuffStacks("tickPool", 0)).toBe(0)

    const viaTick = new BuffEngine({}, [pool, consumer])
    viaTick.triggerDeclaredBuffs([], "dot:probe", 0, { consumesInnerPassion: true })
    expect(viaTick.getHistoricalBuffStacks("tickPool", 0)).toBe(1)
  })

  it("does not grant the Mistwillow stance — only the declared-buff path runs", () => {
    const viaCast = new BuffEngine({ armorSet: "mistwillow" }, GLOBAL_BUFF_DEFS)
    viaCast.processSkillCast("cast:probe", 0, { attackType: "heavy" })
    expect(viaCast.isBuffActiveAtTime("mistwillowHeavyBuff", 0)).toBe(true)

    const viaTick = new BuffEngine({ armorSet: "mistwillow" }, GLOBAL_BUFF_DEFS)
    viaTick.triggerDeclaredBuffs([], "dot:probe", 0, { attackType: "heavy" })
    expect(viaTick.isBuffActiveAtTime("mistwillowHeavyBuff", 0)).toBe(false)
  })
})

describe("class buff data loads", () => {
  it("bellstrikeUmbra's buff defs construct an engine without throwing", () => {
    const engine = new BuffEngine({}, buffDefsForClass("bellstrikeUmbra"), groupBuffDefs())
    expect(engine.definitions.size).toBeGreaterThan(0)
  })
})
