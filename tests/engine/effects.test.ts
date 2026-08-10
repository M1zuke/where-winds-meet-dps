import { describe, it, expect } from "vitest"
import { applyEffect, type EffectSink } from "../../src/engine/effects/apply"
import {
  stat,
  forceOutcome,
  applyBuff,
  consumeStacks,
  artBonus,
  damageMultiplier,
  setStatus,
  type Effect,
} from "../../src/engine/effects/effect"

function recordingSink(): { sink: EffectSink; calls: unknown[][] } {
  const calls: unknown[][] = []
  const sink: EffectSink = {
    stat: (statKey, amount) => calls.push(["stat", statKey, amount]),
    forceOutcome: (outcome) => calls.push(["forceOutcome", outcome]),
    applyBuff: (id, stacks, durationSec) => calls.push(["applyBuff", id, stacks, durationSec]),
    consumeStacks: (id, count) => calls.push(["consumeStacks", id, count]),
    artBonus: (field, amount) => calls.push(["artBonus", field, amount]),
    damageMultiplier: (factor) => calls.push(["damageMultiplier", factor]),
    setStatus: (id, stacks, permanent, durationFrames) =>
      calls.push(["setStatus", id, stacks, permanent, durationFrames]),
  }
  return { sink, calls }
}

describe("applyEffect", () => {
  it("routes every Effect kind to its matching sink method", () => {
    const { sink, calls } = recordingSink()

    applyEffect(sink, stat("allDamageBoost", 0.1))
    applyEffect(sink, forceOutcome("crit"))
    applyEffect(sink, applyBuff("someBuff", 2, 10))
    applyEffect(sink, consumeStacks("someBuff", 3))
    applyEffect(sink, artBonus("extraCritRate", 0.3))
    applyEffect(sink, damageMultiplier(2))
    applyEffect(sink, setStatus("someStatus", { stacks: 1, permanent: true }))

    expect(calls).toEqual([
      ["stat", "allDamageBoost", 0.1],
      ["forceOutcome", "crit"],
      ["applyBuff", "someBuff", 2, 10],
      ["consumeStacks", "someBuff", 3],
      ["artBonus", "extraCritRate", 0.3],
      ["damageMultiplier", 2],
      ["setStatus", "someStatus", 1, true, undefined],
    ])
  })

  it("throws rather than silently no-op-ing on an unrecognised kind", () => {
    const { sink } = recordingSink()
    const bogus = { kind: "notAnEffect" } as unknown as Effect
    expect(() => applyEffect(sink, bogus)).toThrow()
  })
})

describe("effect constructor helpers", () => {
  it("return the literal shape, no runtime work beyond that", () => {
    expect(stat("critRate", 0.05)).toEqual({ kind: "stat", statKey: "critRate", amount: 0.05 })
    expect(forceOutcome("affinity")).toEqual({ kind: "forceOutcome", outcome: "affinity" })
    expect(applyBuff("x")).toEqual({
      kind: "applyBuff",
      id: "x",
      stacks: undefined,
      durationSec: undefined,
    })
    expect(consumeStacks("x", 2)).toEqual({ kind: "consumeStacks", id: "x", count: 2 })
    expect(artBonus("extraPhysPenetration", 5)).toEqual({
      kind: "artBonus",
      field: "extraPhysPenetration",
      amount: 5,
    })
    expect(damageMultiplier(2)).toEqual({ kind: "damageMultiplier", factor: 2 })
    expect(setStatus("x")).toEqual({ kind: "setStatus", id: "x" })
    expect(setStatus("x", { stacks: 3 })).toEqual({ kind: "setStatus", id: "x", stacks: 3 })
  })
})
