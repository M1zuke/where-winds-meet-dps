import { describe, expect, it } from "vitest"
import { collectCastBuffs } from "../../src/engine/castBuffs"
import { StatusLedger } from "../../src/engine/ledger"
import { makeBuff } from "../../src/engine/buff"
import type { Buff } from "../../src/engine/buff"

const CLASS = "testClass"

function stacksShownFor(buff: Buff, seed?: { frame: number; value: number }): number {
  const ledger = new StatusLedger(0, 600)
  ledger.openPermanent(buff.id)
  if (seed) ledger.recordStack(buff.id, seed.frame, seed.value)
  const { buffs } = collectCastBuffs({
    frame: 0,
    timeSec: 0,
    fps: 60,
    ledger,
    statusById: new Map([[buff.id, buff]]),
    buffEngine: null,
  })
  return buffs.find((tag) => tag.id === buff.id)!.stacks
}

const counter = makeBuff(CLASS, { name: "Counter", maxStacks: 5 })
const plainBuff = makeBuff(CLASS, { name: "Plain", maxStacks: 1 })

describe("a cast's status stacks", () => {
  it("shows a counter as empty while it is up but holds nothing", () => {
    expect(stacksShownFor(counter)).toBe(0)
  })

  it("shows a counter's recorded count once one exists", () => {
    expect(stacksShownFor(counter, { frame: 0, value: 3 })).toBe(3)
  })

  it("still shows a buff that does not count as a single stack", () => {
    expect(stacksShownFor(plainBuff)).toBe(1)
  })
})
