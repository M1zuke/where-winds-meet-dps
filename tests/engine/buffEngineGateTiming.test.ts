// Modules below are placeholder content authored only for this file, except the built-in buffs the authored-timing cases read.
import { describe, expect, it } from "vitest"
import type { BuffEngine, DeferredBuffGrant } from "../../src/engine/buffs/buffEngine"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { catalogBuffDefs } from "../../src/engine/buffs/data"
import { applyBuff } from "../../src/engine/effects/effect"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { disintegrationBuffDef } from "../../src/data/innerWays/breakingPointBuffs"
import {
  springThunder,
  thunderousBloomBuffDef,
} from "../../src/data/innerWays/thunderousBloomBuffs"

function placeholder(id: string, patch: Partial<BuffModule> = {}): BuffModule {
  return { id, name: id, duration: 10, affectsAll: true, effects: [], ...patch } as BuffModule
}

function grantAt(engine: BuffEngine, time: number, buffId: string, props = {}): void {
  engine.processSkillCast(`cast:${buffId}@${time}`, time, props, false, [buffId])
}

function deferringCasts(
  engine: BuffEngine,
  casts: { time: number; buffId: string; castTime: number }[],
): DeferredBuffGrant[] {
  const deferred: DeferredBuffGrant[] = []
  for (const { time, buffId, castTime } of casts)
    engine.processSkillCast(
      `cast:${buffId}@${time}`,
      time,
      { castTime },
      false,
      [buffId],
      undefined,
      undefined,
      (grant) => deferred.push(grant),
    )
  return deferred.sort((left, right) => left.timeSec - right.timeSec)
}

describe("a buff-engine gate reads the history as of the time it asks about", () => {
  it("derives the stacks a grant adds to from the window standing at its own time", () => {
    const engine = buffEngineWith({}, [placeholder("pool", { maxStacks: 5, duration: 20 })])
    grantAt(engine, 3, "pool")
    grantAt(engine, 10, "pool")
    grantAt(engine, 5, "pool")
    expect(engine.getHistoricalBuffStacks("pool", 5)).toBe(2)
  })

  it("counts a cooldown from the last grant at or before the grant's own time", () => {
    const engine = buffEngineWith({}, [placeholder("cooled", { cooldown: 12, duration: 5 })])
    grantAt(engine, 0, "cooled")
    grantAt(engine, 30, "cooled")
    grantAt(engine, 13, "cooled")
    expect(engine.isBuffActiveAtTime("cooled", 14)).toBe(true)
  })

  it("refreshes a window that was live at the cast, not one a later grant opened", () => {
    const engine = buffEngineWith({}, [placeholder("refreshed", { refreshOnAnyCast: true })])
    grantAt(engine, 0, "refreshed")
    grantAt(engine, 30, "refreshed")
    engine.processSkillCast("cast:other", 5, {}, false, [])
    expect(engine.isBuffActive("refreshed", 12)).toBe(true)
  })

  it("requires the window a trigger names to be live at the trigger's own time", () => {
    const engine = buffEngineWith({}, [
      placeholder("gate"),
      placeholder("gated", { requiresActiveBuffOnTrigger: "gate", duration: 4 }),
    ])
    grantAt(engine, 0, "gate")
    grantAt(engine, 30, "gate")
    grantAt(engine, 5, "gated")
    expect(engine.isBuffActiveAtTime("gated", 6)).toBe(true)
  })

  it("spends a stack from the pool standing at the cast, not from a later grant's window", () => {
    const engine = buffEngineWith({}, [
      placeholder("pool", { maxStacks: 3, stacks: () => 3, duration: 20 }),
      placeholder("consumer", {
        perCastConsume: { property: "consumesInnerPassion", from: "pool" },
      }),
    ])
    grantAt(engine, 0, "pool")
    grantAt(engine, 30, "pool")
    engine.processSkillCast("cast:use", 5, { consumesInnerPassion: true })
    expect(engine.getHistoricalBuffStacks("pool", 5)).toBe(2)
  })
})

describe("a grant that lands after the call that declared it", () => {
  it("is not in the history until it is committed at its own time", () => {
    const engine = buffEngineWith({}, [placeholder("landing", { buffAppliesOnCastEnd: true })])
    const [grant] = deferringCasts(engine, [{ time: 0, buffId: "landing", castTime: 3 }])
    expect(grant.timeSec).toBe(3)
    expect(engine.isBuffActiveAtTime("landing", 3.5)).toBe(false)
    grant.commit()
    expect(engine.isBuffActiveAtTime("landing", 3.5)).toBe(true)
  })

  it("reads what blocks it from the history at the time it lands", () => {
    const engine = buffEngineWith({}, [
      placeholder("landing", { buffAppliesOnCastEnd: true, blockedWhileActive: ["blocker"] }),
      placeholder("blocker"),
    ])
    const deferred = deferringCasts(engine, [{ time: 0, buffId: "landing", castTime: 3 }])
    grantAt(engine, 1, "blocker")
    for (const grant of deferred) grant.commit()
    expect(engine.isBuffActiveAtTime("landing", 3.5)).toBe(false)
  })

  it("counts its cooldown from the last grant before it lands, not before it was declared", () => {
    const engine = buffEngineWith({}, [
      placeholder("landing", { buffAppliesOnCastEnd: true, cooldown: 12 }),
    ])
    const deferred = deferringCasts(engine, [
      { time: 0, buffId: "landing", castTime: 0.5 },
      { time: 12.2, buffId: "landing", castTime: 1 },
    ])
    for (const grant of deferred) grant.commit()
    expect(engine.isBuffActiveAtTime("landing", 14)).toBe(true)
  })

  it("reads its trigger phase at the time it lands", () => {
    const module = placeholder("landing", {
      buffAppliesOnCastEnd: true,
      triggerPhase: "exhausted",
      duration: 4,
    })
    const insideBreak = buffEngineWith({}, [module], [], exhaustedFrom(25, 10))
    for (const grant of deferringCasts(insideBreak, [{ time: 24, buffId: "landing", castTime: 2 }]))
      grant.commit()
    expect(insideBreak.isBuffActiveAtTime("landing", 27)).toBe(true)

    const beforeBreak = buffEngineWith({}, [module], [], exhaustedFrom(25, 10))
    for (const grant of deferringCasts(beforeBreak, [{ time: 20, buffId: "landing", castTime: 2 }]))
      grant.commit()
    expect(beforeBreak.isBuffActiveAtTime("landing", 23)).toBe(false)
  })

  it("is applied at once when it lands on the call's own time", () => {
    const engine = buffEngineWith({}, [placeholder("immediate")])
    expect(deferringCasts(engine, [{ time: 2, buffId: "immediate", castTime: 3 }])).toEqual([])
    expect(engine.isBuffActiveAtTime("immediate", 2)).toBe(true)
  })
})

describe("an on-damage grant", () => {
  const EVENT_SEC = 4
  const stack = (patch: Partial<BuffModule> = {}) =>
    placeholder("stack", { maxStacks: 5, stackOnDamage: true, ...patch })

  it("decided pre-score counts for the hit that caused it", () => {
    const engine = buffEngineWith({}, [stack({ damageGrantTiming: "preScore" })])
    engine.processDamageHitPreScore(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC)).toBe(1)
    engine.processDamageHitPostQi(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC)).toBe(1)
  })

  it("decided post-Qi does not count for the hit that caused it", () => {
    const engine = buffEngineWith({}, [stack({ damageGrantTiming: "postQi" })])
    engine.processDamageHitPreScore(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC + 1)).toBe(0)
    engine.processDamageHitPostQi(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC)).toBe(0)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC + 1e-5)).toBe(1)
  })

  it("that declares no timing stays before scoring, gated on the bar after the hit", () => {
    const engine = buffEngineWith(
      {},
      [stack({ stackOnDamagePhase: "exhausted" })],
      [],
      exhaustedFrom(0, 100),
    )
    engine.processDamageHitPreScore(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("stack", EVENT_SEC)).toBe(1)
  })

  it.each([
    ["source defined first", ["source", "chained"]],
    ["source defined last", ["chained", "source"]],
  ])(
    "gives a module granted pre-score no pre-score grant of its own for that hit (%s)",
    (_label, order) => {
      const definitions: Record<string, BuffModule> = {
        source: placeholder("source", {
          stackOnDamage: true,
          damageGrantTiming: "preScore",
          effects: [applyBuff("chained", 1)],
        }),
        chained: placeholder("chained", {
          maxStacks: 5,
          stackOnDamage: true,
          damageGrantTiming: "preScore",
          requiresBuffActive: "source",
        }),
      }
      const engine = buffEngineWith(
        {},
        order.map((id) => definitions[id]),
      )
      engine.processDamageHitPreScore(EVENT_SEC)
      expect(engine.getHistoricalBuffStacks("chained", EVENT_SEC)).toBe(1)
      engine.processDamageHitPreScore(EVENT_SEC + 1)
      expect(engine.getHistoricalBuffStacks("chained", EVENT_SEC + 1)).toBe(3)
    },
  )

  it("runs a module's own grant when its source is rate-limited out on that hit", () => {
    const engine = buffEngineWith({}, [
      placeholder("chained", {
        maxStacks: 5,
        stackOnDamage: true,
        damageGrantTiming: "preScore",
        requiresBuffActive: "source",
      }),
      placeholder("source", {
        stackOnDamage: true,
        damageGrantTiming: "preScore",
        stackOnDamageRateLimit: { count: 1, window: 100 },
        effects: [applyBuff("chained", 1)],
      }),
    ])
    engine.processDamageHitPreScore(EVENT_SEC)
    expect(engine.getHistoricalBuffStacks("chained", EVENT_SEC)).toBe(1)
    engine.processDamageHitPreScore(EVENT_SEC + 1)
    expect(engine.getHistoricalBuffStacks("chained", EVENT_SEC + 1)).toBe(2)
  })
})

describe("a damage-over-time tick", () => {
  const TICK_SEC = 4
  const stack = (patch: Partial<BuffModule>) =>
    placeholder("stack", { maxStacks: 5, stackOnDamage: true, ...patch })

  it("feeds a pre-score grant that listens to any damage", () => {
    const engine = buffEngineWith({}, [
      stack({ damageGrantTiming: "preScore", damageGrantListensTo: "anyDamage" }),
    ])
    engine.processDamageHitPreScore(TICK_SEC, undefined, "tick")
    expect(engine.getHistoricalBuffStacks("stack", TICK_SEC)).toBe(1)
  })

  it("feeds a post-Qi grant that listens to any damage", () => {
    const engine = buffEngineWith({}, [
      stack({ damageGrantTiming: "postQi", damageGrantListensTo: "anyDamage" }),
    ])
    engine.processDamageHitPostQi(TICK_SEC, undefined, false, "tick")
    expect(engine.getHistoricalBuffStacks("stack", TICK_SEC + 1e-5)).toBe(1)
  })

  it("feeds no grant that listens to direct hits only", () => {
    const preScore = buffEngineWith({}, [stack({ damageGrantTiming: "preScore" })])
    preScore.processDamageHitPreScore(TICK_SEC, undefined, "tick")
    expect(preScore.getHistoricalBuffStacks("stack", TICK_SEC)).toBe(0)

    const postQi = buffEngineWith({}, [stack({ damageGrantTiming: "postQi" })])
    postQi.processDamageHitPostQi(TICK_SEC, undefined, false, "tick")
    expect(postQi.getHistoricalBuffStacks("stack", TICK_SEC + 1e-5)).toBe(0)
  })
})

describe("the authored timing of the on-damage grants", () => {
  it("is declared on every grant whose timing is known", () => {
    expect(disintegrationBuffDef().damageGrantTiming).toBe("preScore")
    expect(springThunder.damageGrantTiming).toBe("postQi")
    expect(thunderousBloomBuffDef.damageGrantTiming).toBe("preScore")
    const declared = new Map(catalogBuffDefs().map((module) => [module.id, module]))
    for (const id of [
      BUFF.mountainsMightQiImbalance,
      BUFF.cleftpeakStacks,
      BUFF.cleftpeakDeflect,
      BUFF.etherwrathAttackBoost,
      BUFF.starweaveMartialBoost,
      BUFF.tiltrimStack,
    ])
      expect(declared.get(id)?.damageGrantTiming, id).toBe("preScore")
  })

  it("lists the grants that listen to damage-over-time ticks", () => {
    const listening = catalogBuffDefs()
      .filter((module) => module.damageGrantListensTo === "anyDamage")
      .map((module) => module.id)
      .sort()
    expect(listening).toEqual(
      [
        BUFF.cleftpeakStacks,
        BUFF.cleftpeakDeflect,
        BUFF.tiltrimStack,
        BUFF.voidskyScript,
        BUFF.soullinkScript,
      ].sort(),
    )
  })

  it("is missing only on grants whose timing is not declared", () => {
    const undeclared = catalogBuffDefs()
      .filter(
        (module) => (module.stackOnDamage || module.perHitConsume) && !module.damageGrantTiming,
      )
      .map((module) => module.id)
    expect(undeclared).toEqual([BUFF.qiankunsLockQiImbalance])
  })
})
