import { describe, expect, it } from "vitest"
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  HAWKWING_STEP_SEC,
  hawkwingStacksSchedule,
} from "../../src/engine/buffs/hawkwing"

function hitTrain(duration: number, interval = 0.3): number[] {
  const hits: number[] = []
  for (let t = 0; t < duration; t += interval) hits.push(t)
  return hits
}

function averageBonus(
  hitTimesSec: readonly number[],
  rollProbability: number,
  rotationDurationSec: number,
): number {
  const schedule = hawkwingStacksSchedule(hitTimesSec, rollProbability, rotationDurationSec)
  const steps = Math.ceil(rotationDurationSec / HAWKWING_STEP_SEC) + 1
  let total = 0
  for (let step = 0; step < steps; step++) {
    total += schedule.getExpectedStacksAtTime(step * HAWKWING_STEP_SEC)
  }
  return (total / steps) * HAWKWING_BONUS_PER_STACK
}

describe("hawkwingStacksSchedule", () => {
  it("is 0 when there are no hits", () => {
    expect(averageBonus([], 0.4, 60.7)).toBe(0)
  })

  it("is 0 when the rotation duration is non-positive", () => {
    expect(averageBonus(hitTrain(60.7), 0.4, 0)).toBe(0)
  })

  it("is 0 when the roll probability is non-positive", () => {
    expect(averageBonus(hitTrain(60.7), 0, 60.7)).toBe(0)
  })

  it("lands near 0.096-0.099 at the parity build's roll probability (~0.3997)", () => {
    const bonus = averageBonus(hitTrain(60.7), 0.3997, 60.7)
    expect(bonus).toBeGreaterThan(0.096)
    expect(bonus).toBeLessThan(0.099)
  })

  it("lands near 0.074 at a lower roll probability (0.15)", () => {
    const bonus = averageBonus(hitTrain(60.7), 0.15, 60.7)
    expect(bonus).toBeGreaterThan(0.072)
    expect(bonus).toBeLessThan(0.076)
  })

  it("a lower affinity rate yields a correspondingly smaller bonus", () => {
    const low = averageBonus(hitTrain(60.7), 0.15, 60.7)
    const high = averageBonus(hitTrain(60.7), 0.3997, 60.7)
    expect(low).toBeLessThan(high)
  })

  it("never exceeds the 5-stack cap, at any sampled time", () => {
    const rotationDurationSec = 120
    const schedule = hawkwingStacksSchedule(
      hitTrain(rotationDurationSec, 0.05),
      1,
      rotationDurationSec,
    )
    const steps = Math.ceil(rotationDurationSec / HAWKWING_STEP_SEC) + 1
    for (let step = 0; step < steps; step++) {
      expect(schedule.getExpectedStacksAtTime(step * HAWKWING_STEP_SEC)).toBeLessThanOrEqual(
        HAWKWING_MAX_STACKS,
      )
    }
    expect(
      averageBonus(hitTrain(rotationDurationSec, 0.05), 1, rotationDurationSec),
    ).toBeLessThanOrEqual(0.1)
  })
})
