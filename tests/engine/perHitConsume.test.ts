import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { makeSkill } from "../../src/engine/skill"
import { stat } from "../../src/engine/effects/effect"

const POOL = "testChargePool"
const BOOST = "testHitBoost"

const poolDef: BuffModule = {
  id: POOL,
  name: "Test Charge Pool",
  buffAppliesOnCastEnd: true,
  rateLimit: { count: 1, window: 15 },
  duration: 12,
  maxStacks: 5,
  stacks: () => 5,
  stackOnDamage: true,
  stackOnDamagePhase: ["below30", "exhausted"],
  stackOnDamageScoped: true,
  stackOnDamageOnlyWhileActive: true,
  stackOnDamageRateLimit: { count: 1, window: 2 },
  effects: [],
}

const boostDef: BuffModule = {
  id: BOOST,
  name: "Test Hit Boost",
  perHitConsume: { from: POOL },
  duration: 2,
  effects: [stat("allDamageBoost", 0.15)],
}

const PHASED = { belowQiTime: 20, qiBreakTime: 25, bossBreakDuration: 10 }

const qualifier = makeSkill("test", { name: "Qualifier", receives: [POOL, BOOST] })
const bystander = makeSkill("test", { name: "Bystander" })

function engineWithPool(params: Record<string, unknown> = {}): BuffEngine {
  return new BuffEngine(params, [poolDef, boostDef])
}

function boostAmount(engine: BuffEngine, time: number): number | undefined {
  return engine.calculateDamageEffects(qualifier, time).breakdown[BOOST]
}

describe("triggered charge pool — grant at cast end, once per window, bounded retention", () => {
  it("grants its full stack count at the cast's end, not its start", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    expect(engine.getHistoricalBuffStacks(POOL, 0.5)).toBe(0)
    expect(engine.getHistoricalBuffStacks(POOL, 1)).toBe(5)
  })

  it("a second cast inside the rate-limit window neither re-grants nor refreshes", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processSkillCast("cast:martial", 5, { castTime: 1 }, false, [POOL])
    expect(engine.getHistoricalBuffStacks(POOL, 12.9)).toBe(5)
    expect(engine.isBuffActiveAtTime(POOL, 13.1)).toBe(false)
  })

  it("re-procs once the rate-limit window has passed", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processSkillCast("cast:martial", 16, { castTime: 1 }, false, [POOL])
    expect(engine.getHistoricalBuffStacks(POOL, 18)).toBe(5)
  })
})

describe("perHitConsume — a received hit spends a stack to open the window", () => {
  it("opens for the hit and the window length, spending exactly one stack", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(1, qualifier)
    expect(boostAmount(engine, 1)).toBe(0.15)
    expect(boostAmount(engine, 2.9)).toBe(0.15)
    expect(boostAmount(engine, 3.1)).toBeUndefined()
    expect(engine.getHistoricalBuffStacks(POOL, 1)).toBe(4)
  })

  it("a hit inside the live window spends nothing and does not extend it", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(1, qualifier)
    engine.processDamageHit(2.5, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 2.5)).toBe(4)
    expect(boostAmount(engine, 3.2)).toBeUndefined()
  })

  it("the next hit after the window closes spends the next stack", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(1, qualifier)
    engine.processDamageHit(3.1, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 3.1)).toBe(3)
    expect(boostAmount(engine, 4)).toBe(0.15)
  })

  it("an empty pool opens nothing", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    for (const time of [1, 3.1, 5.2, 7.3, 9.4]) engine.processDamageHit(time, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 9.4)).toBe(0)
    engine.processDamageHit(11.5, qualifier)
    expect(boostAmount(engine, 11.5)).toBeUndefined()
  })

  it("a hit from a skill that does not receive the def neither spends nor opens", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(1, bystander)
    expect(engine.getHistoricalBuffStacks(POOL, 1)).toBe(5)
    expect(boostAmount(engine, 1)).toBeUndefined()
  })

  it("spends from an earlier pool window untouched by a later one", () => {
    const engine = engineWithPool()
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processSkillCast("cast:martial", 17, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(2, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 2)).toBe(4)
    expect(boostAmount(engine, 2.5)).toBe(0.15)
    expect(engine.getHistoricalBuffStacks(POOL, 18)).toBe(5)
  })
})

describe("stackOnDamage top-up — scoped, phase-gated, rate-limited, expiry-preserving", () => {
  it("a qualifying hit in a listed phase restores one stack without moving the window's expiry", () => {
    const engine = engineWithPool(PHASED)
    engine.processSkillCast("cast:martial", 19, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(20.1, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 20.1)).toBe(4)
    engine.processDamageHit(22.2, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 22.2)).toBe(4)
    expect(engine.getHistoricalBuffStacks(POOL, 31.9)).toBeGreaterThan(0)
    expect(engine.isBuffActiveAtTime(POOL, 32.1)).toBe(false)
  })

  it("grants nothing outside the listed phases", () => {
    const engine = engineWithPool(PHASED)
    engine.processSkillCast("cast:martial", 0, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(1, qualifier)
    engine.processDamageHit(3.1, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 3.1)).toBe(3)
  })

  it("throttles restores to its own rate-limit window", () => {
    const engine = engineWithPool(PHASED)
    engine.processSkillCast("cast:martial", 19, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(20.05, qualifier)
    engine.processDamageHit(22.1, qualifier)
    engine.processDamageHit(24.15, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 24.15)).toBe(4)
    engine.processDamageHit(25.0, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 25.0)).toBe(4)
  })

  it("never revives a pool whose last stack was spent", () => {
    const engine = engineWithPool(PHASED)
    engine.processSkillCast("cast:martial", 9, { castTime: 1 }, false, [POOL])
    for (const time of [10, 12.1, 14.2, 16.3, 18.4]) engine.processDamageHit(time, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 18.4)).toBe(0)
    engine.processDamageHit(20.5, qualifier)
    expect(engine.getHistoricalBuffStacks(POOL, 20.5)).toBe(0)
    expect(boostAmount(engine, 20.5)).toBeUndefined()
  })

  it("a hit from a skill that does not receive the def restores nothing", () => {
    const engine = engineWithPool(PHASED)
    engine.processSkillCast("cast:martial", 19, { castTime: 1 }, false, [POOL])
    engine.processDamageHit(20.1, qualifier)
    engine.processDamageHit(22.2, bystander)
    expect(engine.getHistoricalBuffStacks(POOL, 22.2)).toBe(4)
  })
})
