import { describe, expect, it } from "vitest"
import { MeterEngine } from "../../src/engine/meter"
import { StatusLedger } from "../../src/engine/ledger"
import type { MeterMaxContext } from "../../src/definitions/resources/meterDef"

const FPS = 60

const maxContext: MeterMaxContext = {
  paramTier: () => 0,
  paramOn: () => false,
  whiteAffinityRate: 0,
}

function makeEngine(): MeterEngine {
  const ledger = new StatusLedger(-600, 6000)
  return new MeterEngine(
    { id: "test", name: "Test", capacity: 100, start: "full", regenPerSecond: 10 },
    maxContext,
    FPS,
    ledger,
  )
}

describe("a meter cursor that has already advanced past a requested frame", () => {
  it("apply processes at the cursor's own frame instead of rewinding it, and warns", () => {
    const meter = makeEngine()
    meter.advanceTo(20)
    meter.apply(10, -30)
    expect(meter.value()).toBe(70)
    expect(meter.warnings).toEqual([
      {
        frame: 20,
        meterId: "test",
        message: "requested at frame 10, before the cursor — applied at 20 instead",
      },
    ])
  })

  it("startDrain opens its interval at the cursor's own frame instead of rewinding it, and warns", () => {
    const meter = makeEngine()
    meter.advanceTo(20)
    meter.startDrain(10, 80, 60)
    meter.advanceTo(21)
    expect(meter.value()).toBeCloseTo(100 - 60 / FPS, 5)
    expect(meter.warnings.some((warning) => warning.message.includes("before the cursor"))).toBe(
      true,
    )
  })
})

function makePausingEngine(): MeterEngine {
  const ledger = new StatusLedger(-600, 6000)
  return new MeterEngine(
    {
      id: "test",
      name: "Test",
      capacity: 100,
      start: "full",
      regenPerSecond: 10,
      regenPauseAfterSpendSec: 1.2,
    },
    maxContext,
    FPS,
    ledger,
  )
}

describe("the post-spend regeneration pause", () => {
  it("holds regeneration until 1.2s after a spend, then resumes", () => {
    const paused = makePausingEngine()
    paused.apply(0, -10)
    paused.advanceTo(1.2 * FPS - 1)
    expect(paused.value()).toBe(90)
    paused.advanceTo(1.2 * FPS + 1)
    expect(paused.value()).toBeGreaterThan(90)
  })

  it("is not restarted by a gain", () => {
    const paused = makePausingEngine()
    paused.apply(0, -10)
    paused.apply(1, 5)
    paused.advanceTo(1.2 * FPS)
    // Still paused through frame 1.2*FPS: the pause is counted from the spend
    // at frame 0, not restarted by the gain at frame 1.
    expect(paused.value()).toBe(95)
    paused.advanceTo(1.2 * FPS + 1)
    expect(paused.value()).toBeGreaterThan(95)
  })
})
