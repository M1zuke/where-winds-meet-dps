// Scoped to Bellstrike Umbra's default rotation — see docs/TESTING.md § "Class
// scoping"; the rotation only supplies casts and a damage-over-time debuff to
// run the window against, no number here is an anchor.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { FPS } from "../../src/engine/timeline"
import type { Inputs, Result } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function runWithWindow(fixedWindowSec: number | undefined): Result {
  const rotation = defaultRotationForClass(CLASS)!
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: { ...rotation, fixedWindowSec },
  }
  return runEngine(inputs)
}

const baseline = runWithWindow(undefined)
const castSec = baseline.castDuration

describe("fixed rotation window — no window set", () => {
  it("reports the cast length as both durations and keeps today's numbers", () => {
    expect(baseline.castDuration).toBe(baseline.rotationDuration)
    expect(baseline.dps).toBeCloseTo(baseline.totalDamage / baseline.rotationDuration, 6)
  })
})

describe("fixed rotation window — longer than the casts", () => {
  const padded = runWithWindow(castSec + 5)

  it("divides by the window and still reports the cast length", () => {
    expect(padded.rotationDuration).toBeCloseTo(castSec + 5, 6)
    expect(padded.castDuration).toBeCloseTo(castSec, 6)
    expect(padded.dps).toBeCloseTo(padded.totalDamage / (castSec + 5), 6)
  })

  it("lays out no cast in the idle tail", () => {
    const lateCasts = padded.casts!.filter((cast) => !cast.prePull && cast.timeSec >= castSec)
    expect(lateCasts).toEqual([])
  })

  it("keeps the damage-over-time effects ticking into the idle tail, and counts them", () => {
    const tailTicks = padded.timeline!.filter(
      (event) => event.kind === "dot" && event.timeSec > castSec,
    )
    expect(tailTicks.length).toBeGreaterThan(0)
    const tailEvents = padded.timeline!.filter((event) => event.timeSec > castSec)
    const tailDamage = tailEvents.reduce((sum, event) => sum + event.damage, 0)
    expect(padded.totalDamage - baseline.totalDamage).toBeCloseTo(tailDamage, 3)
  })
})

describe("fixed rotation window — shorter than the casts", () => {
  const windowFrame = Math.round((castSec * FPS) / 2)
  const windowSec = windowFrame / FPS
  const cut = runWithWindow(windowSec)

  it("divides by the window and still reports the full cast length", () => {
    expect(cut.rotationDuration).toBeCloseTo(windowSec, 6)
    expect(cut.castDuration).toBeCloseTo(castSec, 6)
  })

  it("scores nothing past the window", () => {
    for (const event of cut.timeline!) expect(event.frame).toBeLessThanOrEqual(windowFrame)
    expect(cut.totalDamage).toBeLessThan(baseline.totalDamage)
  })

  it("lists a cast past the window as outside the fight", () => {
    const late = cut.casts!.filter((cast) => !cast.prePull && cast.timeSec > windowSec)
    expect(late.length).toBeGreaterThan(0)
    for (const cast of late) expect(cast.inWindow).toBe(false)
  })

  it("lets a dropped hit open no status window", () => {
    for (const window of cut.buffWindows!)
      expect(window.startSec).toBeLessThanOrEqual(windowSec + 1 / FPS)
  })
})
