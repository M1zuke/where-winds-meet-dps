import { describe, expect, it } from "vitest"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
import { landDamageHit } from "../helpers/landDamageHit"
import {
  disintegrationBrokenTargetBuffDef,
  disintegrationBuffDef,
} from "../../src/data/innerWays/breakingPointBuffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { makeSkill } from "../../src/engine/skill"

const anySkill = () => makeSkill("test", { name: "Any Skill" })

function statAmount(effects: { statKey: string; amount: number }[], statKey: string): number {
  return effects
    .filter((effect) => effect.statKey === statKey)
    .reduce((sum, effect) => sum + effect.amount, 0)
}

const BELOW_PERFECT_DODGE = { breakingPoint: true, breakingPointTier: 5 }
const AT_PERFECT_DODGE = { breakingPoint: true, breakingPointTier: 6 }
const EXHAUSTED_FROM_START = exhaustedFrom(0, 100)
const BOTH_ROUTES = [disintegrationBrokenTargetBuffDef(), disintegrationBuffDef()]

describe("Disintegration — Qi-broken target route", () => {
  it("gains no stack from a damaging hit outside the Exhausted phase", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES)
    landDamageHit(engine, 1)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegrationBrokenTarget, 1)).toBe(0)
  })

  it("gains one stack per damaging hit inside the Exhausted phase", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    landDamageHit(engine, 0.1)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegrationBrokenTarget, 0.1)).toBe(1)
    landDamageHit(engine, 0.2)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegrationBrokenTarget, 0.2)).toBe(2)
  })

  it("stops stacking at five", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    for (let hit = 0; hit < 8; hit++) landDamageHit(engine, hit * 0.01)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegrationBrokenTarget, 0.07)).toBe(5)
  })

  it("holds a stack for five seconds", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    landDamageHit(engine, 0)
    expect(engine.isBuffActiveAtTime(BUFF.disintegrationBrokenTarget, 4.9)).toBe(true)
    expect(engine.isBuffActiveAtTime(BUFF.disintegrationBrokenTarget, 5.1)).toBe(false)
  })

  it("never feeds the Perfect Dodge stacks", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    landDamageHit(engine, 0)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 0.1)).toBe(0)
  })
})

describe("Disintegration — Perfect Dodge trigger route", () => {
  it("a Perfect Dodge at the Perfect Dodge tier adds 5 stacks in any (normal) phase", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES)
    engine.processSkillCast("cast:perfectDodge", 0, {}, false, [BUFF.disintegration])
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 0)).toBe(5)
  })

  it("a second Perfect Dodge inside the 15 s window adds nothing", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES)
    engine.processSkillCast("cast:perfectDodge", 0, {}, false, [BUFF.disintegration])
    engine.processSkillCast("cast:perfectDodge", 1, {}, false, [BUFF.disintegration])
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 1.5)).toBe(5)
  })

  it("a Perfect Dodge after the 15 s window grants 5 stacks again", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES)
    engine.processSkillCast("cast:perfectDodge", 0, {}, false, [BUFF.disintegration])
    engine.processSkillCast("cast:perfectDodge", 16, {}, false, [BUFF.disintegration])
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 16.5)).toBe(5)
  })

  it("below the Perfect Dodge tier, a Perfect Dodge adds no stacks", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES)
    engine.processSkillCast("cast:perfectDodge", 3, {}, false, [BUFF.disintegration])
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 4)).toBe(0)
  })

  it("a Perfect Dodge leaves the Qi-broken target stacks untouched", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    landDamageHit(engine, 0)
    engine.processSkillCast("cast:perfectDodge", 1, {}, false, [BUFF.disintegration])
    expect(engine.getHistoricalBuffStacks(BUFF.disintegrationBrokenTarget, 1.5)).toBe(1)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, 1.5)).toBe(5)
  })
})

describe("Disintegration — per-stack magnitude", () => {
  it("reaches the panel as physical penetration and crit damage boost, scaling per stack", () => {
    const engine = buffEngineWith(BELOW_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    landDamageHit(engine, 0)
    const oneStack = engine.calculateDamageEffects(anySkill(), 0)
    expect(statAmount(oneStack.effects, "phys.penetration")).toBeCloseTo(0.05, 9)
    expect(statAmount(oneStack.effects, "critDamageBoost")).toBeCloseTo(0.05, 9)

    landDamageHit(engine, 0.1)
    const twoStacks = engine.calculateDamageEffects(anySkill(), 0.1)
    expect(statAmount(twoStacks.effects, "phys.penetration")).toBeCloseTo(0.1, 9)
    expect(statAmount(twoStacks.effects, "critDamageBoost")).toBeCloseTo(0.1, 9)
  })

  it("adds the two routes together: a Perfect Dodge into a Qi-broken window reaches ten stacks' worth", () => {
    const engine = buffEngineWith(AT_PERFECT_DODGE, [], BOTH_ROUTES, EXHAUSTED_FROM_START)
    for (let hit = 0; hit < 5; hit++) landDamageHit(engine, hit * 0.01)
    engine.processSkillCast("cast:perfectDodge", 0.1, {}, false, [BUFF.disintegration])
    const effects = engine.calculateDamageEffects(anySkill(), 0.2)
    expect(statAmount(effects.effects, "phys.penetration")).toBeCloseTo(0.5, 9)
    expect(statAmount(effects.effects, "critDamageBoost")).toBeCloseTo(0.5, 9)
  })
})
