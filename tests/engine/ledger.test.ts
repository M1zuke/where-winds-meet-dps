import { describe, expect, it } from "vitest"
import { StatusLedger, windowEndAt } from "../../src/engine/ledger"

const SPAN_START = -120
const SPAN_END = 3600

function ledger(): StatusLedger {
  return new StatusLedger(SPAN_START, SPAN_END)
}

describe("StatusLedger — stacks", () => {
  it("reads the latest value recorded at or before the frame, and 0 before any", () => {
    const led = ledger()
    led.recordStack("bleed", 100, 1)
    led.recordStack("bleed", 200, 3)
    led.recordStack("bleed", 300, 0)

    expect(led.stacksAt("bleed", 99)).toBe(0)
    expect(led.stacksAt("bleed", 100)).toBe(1)
    expect(led.stacksAt("bleed", 199)).toBe(1)
    expect(led.stacksAt("bleed", 250)).toBe(3)
    expect(led.stacksAt("bleed", 10_000)).toBe(0)
    expect(led.stacksAt("unknown", 100)).toBe(0)
  })

  it("distinguishes never-recorded from recorded-as-zero", () => {
    const led = ledger()
    expect(led.hasStackHistory("bleed")).toBe(false)
    led.recordStack("bleed", 10, 0)
    expect(led.hasStackHistory("bleed")).toBe(true)
    expect(led.stacksAt("bleed", 10)).toBe(0)
  })
})

describe("StatusLedger — windows", () => {
  it("is active on [start, end) and reports the ids up at a frame", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 200)
    expect(led.isActiveAt("buff", 99)).toBe(false)
    expect(led.isActiveAt("buff", 100)).toBe(true)
    expect(led.isActiveAt("buff", 199)).toBe(true)
    expect(led.isActiveAt("buff", 200)).toBe(false)
    expect(led.activeIdsAt(150)).toEqual(["buff"])
    expect(led.activeIdsAt(250)).toEqual([])
  })

  it("opens a permanent window across the whole span, once", () => {
    const led = ledger()
    led.openPermanent("aura")
    led.openPermanent("aura")
    expect(led.windowsOf("aura")).toEqual([{ start: SPAN_START, end: SPAN_END }])
  })

  it("gates stacks on the window — the question a trigger condition asks", () => {
    const led = ledger()
    led.recordStack("bleed", 100, 4)
    led.pushWindow("bleed", 100, 200)
    expect(led.conditionStacksAt("bleed", 150)).toBe(4)
    expect(led.conditionStacksAt("bleed", 250)).toBe(0)
    expect(led.stacksAt("bleed", 250)).toBe(4)
  })

  it("picks the furthest-ending window when several overlap", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 200)
    led.pushWindow("buff", 120, 400)
    expect(led.longestActiveWindow("buff", 150)?.end).toBe(400)
    expect(led.remainingFramesAt("buff", 150)).toBe(250)
    expect(led.remainingFramesAt("buff", 500)).toBeUndefined()
  })
})

describe("StatusLedger — extensions are invisible before they happen", () => {
  it("subtracts an extension applied after the queried frame", () => {
    const window = { start: 0, end: 400, extensions: [{ frame: 300, amount: 100 }] }
    expect(windowEndAt(window, 200)).toBe(300)
    expect(windowEndAt(window, 300)).toBe(400)
    expect(windowEndAt(window, 350)).toBe(400)
  })

  it("feeds that back through remainingFramesAt", () => {
    const led = ledger()
    led.pushWindow("dot", 0, 400)
    const window = led.longestActiveWindow("dot", 0)!
    window.end = 500
    window.extensions = [{ frame: 300, amount: 100 }]
    expect(led.remainingFramesAt("dot", 200)).toBe(200)
    expect(led.remainingFramesAt("dot", 400)).toBe(100)
  })
})
