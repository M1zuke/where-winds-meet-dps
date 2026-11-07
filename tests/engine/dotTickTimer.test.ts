import { describe, expect, it } from "vitest"
import { makeDebuff, type DebuffDotSpec } from "../../src/engine/debuff"
import {
  dotTicksPerWindow,
  effectiveFirstTickOffsetFrames,
  effectiveTickIntervalFrames,
} from "../../src/engine/dot"

const FRAMES_PER_MS = 60 / 1000

function tickingDot(overrides: Partial<DebuffDotSpec>): DebuffDotSpec {
  return {
    tickIntervalFrames: 60,
    physMultiplier: 1,
    physFixed: 0,
    attributeMultiplier: 0,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "sustain",
    count: 1,
    ...overrides,
  }
}

describe("self-rescheduling DoT tick timer", () => {
  it.each([
    [6, 132],
    [30, 528],
    [60, 1023],
  ])("runs a %i-frame interval for %i ms", (intervalFrames, expectedMs) => {
    const dot = tickingDot({ tickIntervalFrames: intervalFrames, reschedulesPerTick: true })
    expect(effectiveTickIntervalFrames(dot)).toBeCloseTo(expectedMs * FRAMES_PER_MS, 9)
  })

  it("delays the first tick the same way and leaves a tick on application at zero", () => {
    const delayed = tickingDot({ firstTickOffsetFrames: 30, reschedulesPerTick: true })
    const immediate = tickingDot({ firstTickOffsetFrames: 0, reschedulesPerTick: true })
    expect(effectiveFirstTickOffsetFrames(delayed)).toBeCloseTo(528 * FRAMES_PER_MS, 9)
    expect(effectiveFirstTickOffsetFrames(immediate)).toBe(0)
  })

  it("leaves a fixed-schedule pulse and an unestablished cadence on their exact interval", () => {
    expect(effectiveTickIntervalFrames(tickingDot({ reschedulesPerTick: false }))).toBe(60)
    expect(effectiveTickIntervalFrames(tickingDot({}))).toBe(60)
  })

  it("emits 59 ticks of a 1 s DoT first due at 0.5 s across an unbroken minute", () => {
    const debuff = makeDebuff("fictional", {
      durationFrames: 3600,
      dot: tickingDot({ firstTickOffsetFrames: 30, reschedulesPerTick: true }),
    })
    expect(dotTicksPerWindow(debuff)).toBe(59)
  })
})
