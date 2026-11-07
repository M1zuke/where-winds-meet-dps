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
// This rotation's own first damaging hit lands a little into the active
// phase, so the DPS window opens after frame 0 — docs/TIMELINE.md § "Fight
// window".
const fightStartFrame = Math.round(baseline.fightStartSec * FPS)

describe("fixed rotation window — no window set", () => {
  it("measures the DPS window from the fight start to the last damaging hit, and still reports the full cast length", () => {
    const lastHitFrame = Math.max(
      ...baseline
        .timeline!.filter((event) => event.kind === "hit" && event.damage > 0)
        .map((event) => event.frame),
    )
    expect(baseline.castDuration).toBeCloseTo(castSec, 6)
    expect(baseline.rotationDuration).toBeCloseTo(lastHitFrame / FPS - baseline.fightStartSec, 6)
    expect(baseline.rotationDuration).toBeLessThan(castSec - baseline.fightStartSec)
    expect(baseline.dps).toBeCloseTo(baseline.totalDamage / baseline.rotationDuration, 6)
  })
})

describe("fixed rotation window — longer than the casts", () => {
  const padded = runWithWindow(castSec + 5)

  it("divides by the window and still reports the cast length", () => {
    expect(padded.rotationDuration).toBeCloseTo(castSec + 5, 1)
    expect(padded.castDuration).toBeCloseTo(castSec, 6)
    expect(padded.dps).toBeCloseTo(padded.totalDamage / padded.rotationDuration, 6)
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

  it("runs the full fixed length regardless of where the last damaging hit lands", () => {
    const lastHitFrame = Math.max(
      ...padded
        .timeline!.filter((event) => event.kind === "hit" && event.damage > 0)
        .map((event) => event.frame),
    )
    expect(lastHitFrame / FPS).toBeLessThan(fightStartFrame / FPS + (castSec + 5))
    expect(padded.rotationDuration).toBeCloseTo(castSec + 5, 1)
  })
})

describe("fixed rotation window — shorter than the casts", () => {
  const windowFrame = Math.round((castSec * FPS) / 2)
  const windowSec = windowFrame / FPS
  const cut = runWithWindow(windowSec)
  // The window's own end is fightStart + window, not window measured from 0.
  const windowEndFrame = fightStartFrame + windowFrame
  const windowEndSec = windowEndFrame / FPS

  it("divides by the window and still reports the full cast length", () => {
    expect(cut.rotationDuration).toBeCloseTo(windowSec, 6)
    expect(cut.castDuration).toBeCloseTo(castSec, 6)
  })

  it("scores nothing past the window's own end", () => {
    for (const event of cut.timeline!) expect(event.frame).toBeLessThanOrEqual(windowEndFrame)
    expect(cut.totalDamage).toBeLessThan(baseline.totalDamage)
  })

  it("lists a cast past the window as outside the fight", () => {
    const late = cut.casts!.filter((cast) => !cast.prePull && cast.timeSec > windowEndSec)
    expect(late.length).toBeGreaterThan(0)
    for (const cast of late) expect(cast.inWindow).toBe(false)
  })

  it("lets a dropped hit open no status window", () => {
    for (const window of cut.buffWindows!)
      expect(window.startSec).toBeLessThanOrEqual(windowEndSec + 1 / FPS)
  })
})
