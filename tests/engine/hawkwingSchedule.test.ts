import { describe, expect, it } from "vitest"
import { hawkwingStacksSchedule } from "../../src/engine/buffs/hawkwing"
import { mulberry32 } from "../../src/engine/rng"

const HIT_TIMES_SEC = Array.from({ length: 40 }, (_, index) => index * 0.7)
const PROC_CHANCE = 0.35
const DURATION_SEC = 30

function sampleStacks(schedule: ReturnType<typeof hawkwingStacksSchedule>): number[] {
  return Array.from({ length: 120 }, (_, index) => schedule.getExpectedStacksAtTime(index * 0.25))
}

describe("hawkwing stacks schedule", () => {
  it("returns the same expected stacks for a repeated hit list", () => {
    const first = hawkwingStacksSchedule(HIT_TIMES_SEC, PROC_CHANCE, DURATION_SEC)
    const second = hawkwingStacksSchedule([...HIT_TIMES_SEC], PROC_CHANCE, DURATION_SEC)
    expect(sampleStacks(second)).toEqual(sampleStacks(first))
    expect(Math.max(...sampleStacks(first))).toBeGreaterThan(0)
  })

  it("reruns the simulation for every run rng", () => {
    const withSeed = (seed: number) =>
      sampleStacks(
        hawkwingStacksSchedule(HIT_TIMES_SEC, PROC_CHANCE, DURATION_SEC, mulberry32(seed)),
      )
    const firstSeed = withSeed(1)
    expect(withSeed(1)).toEqual(firstSeed)
    expect(withSeed(2)).not.toEqual(firstSeed)
  })
})
