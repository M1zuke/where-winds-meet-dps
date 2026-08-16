import { describe, expect, it } from "vitest"
import { concentrationActiveProbSchedule } from "../../src/engine/buffs/concentration"
import { mulberry32 } from "../../src/engine/rng"

function hitTrain(duration: number, interval = 0.3): number[] {
  const hits: number[] = []
  for (let t = 0; t < duration; t += interval) hits.push(t)
  return hits
}

describe("concentrationActiveProbSchedule", () => {
  it("is always 0 when there are no weapon hits", () => {
    const sched = concentrationActiveProbSchedule([], 0.4, 60.7)
    expect(sched.getActiveProbAtTime(0)).toBe(0)
    expect(sched.getActiveProbAtTime(30)).toBe(0)
  })

  it("is always 0 when the rotation duration is non-positive", () => {
    const sched = concentrationActiveProbSchedule(hitTrain(60.7), 0.4, 0)
    expect(sched.getActiveProbAtTime(30)).toBe(0)
  })

  it("is always 0 when the roll probability is non-positive", () => {
    const sched = concentrationActiveProbSchedule(hitTrain(60.7), 0, 60.7)
    expect(sched.getActiveProbAtTime(30)).toBe(0)
  })

  it("is 0 at t=0 (the 4-hit ramp hasn't happened yet)", () => {
    const sched = concentrationActiveProbSchedule(hitTrain(60.7), 0.4227, 60.7)
    expect(sched.getActiveProbAtTime(0)).toBe(0)
  })

  it("ramps up over the first few seconds and saturates near 1 for a dense, high-p rotation", () => {
    const sched = concentrationActiveProbSchedule(hitTrain(60.7), 0.4227, 60.7)
    const early = sched.getActiveProbAtTime(1)
    const mid = sched.getActiveProbAtTime(3)
    const late = sched.getActiveProbAtTime(30)
    expect(early).toBeLessThan(mid)
    expect(mid).toBeLessThan(late)
    expect(late).toBeGreaterThan(0.95)
  })

  it("a lower affinity/direct-affinity roll probability ramps later (spot-check)", () => {
    const hits = hitTrain(60.7)
    const highP = concentrationActiveProbSchedule(hits, 0.4227, 60.7)
    const lowP = concentrationActiveProbSchedule(hits, 0.15, 60.7)
    expect(lowP.getActiveProbAtTime(3)).toBeLessThan(highP.getActiveProbAtTime(3))
    expect(lowP.getActiveProbAtTime(60)).toBeLessThanOrEqual(highP.getActiveProbAtTime(60))
  })

  it("never exceeds 1", () => {
    const sched = concentrationActiveProbSchedule(hitTrain(120, 0.05), 1, 120)
    for (let t = 0; t <= 120; t += 5) {
      expect(sched.getActiveProbAtTime(t)).toBeLessThanOrEqual(1)
    }
  })
})

describe("concentrationActiveProbSchedule under a parse run", () => {
  const hits = hitTrain(60.7)

  it("averages 500 runs when given no rng", () => {
    const sched = concentrationActiveProbSchedule(hits, 0.4227, 60.7)
    const partial = Array.from({ length: 200 }, (_unused, step) =>
      sched.getActiveProbAtTime(step * 0.05),
    ).filter((prob) => prob > 0 && prob < 1)
    expect(partial.length).toBeGreaterThan(0)
  })

  it("runs a single trajectory when given an rng", () => {
    const sched = concentrationActiveProbSchedule(hits, 0.4227, 60.7, mulberry32(77))
    for (let step = 0; step < 200; step++) {
      expect([0, 1]).toContain(sched.getActiveProbAtTime(step * 0.05))
    }
  })
})
