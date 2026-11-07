import { describe, expect, it } from "vitest"
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  HawkwingTracker,
} from "../../src/engine/buffs/hawkwing"
import { MulberryBank, mulberry32 } from "../../src/engine/rng"

const SAMPLE_STEP_SEC = 0.05

function hitTrain(duration: number, interval = 0.3): number[] {
  const hits: number[] = []
  for (let t = 0; t < duration; t += interval) hits.push(t)
  return hits
}

function trackerAfter(
  rollTimesSec: readonly number[],
  procChance: number,
  runRandom?: () => number,
): HawkwingTracker {
  const tracker = new HawkwingTracker(procChance, runRandom, true)
  for (const timeSec of rollTimesSec) tracker.roll(timeSec, 1)
  return tracker
}

function sampleTimes(durationSec: number): number[] {
  return Array.from(
    { length: Math.ceil(durationSec / SAMPLE_STEP_SEC) + 1 },
    (_unused, step) => step * SAMPLE_STEP_SEC,
  )
}

function averageBonus(
  rollTimesSec: readonly number[],
  procChance: number,
  durationSec: number,
): number {
  const tracker = trackerAfter(rollTimesSec, procChance)
  const times = sampleTimes(durationSec)
  const total = times.reduce((sum, timeSec) => sum + tracker.expectedStacksAt(timeSec), 0)
  return (total / times.length) * HAWKWING_BONUS_PER_STACK
}

describe("HawkwingTracker", () => {
  it("is 0 when nothing has rolled", () => {
    expect(averageBonus([], 0.4, 60.7)).toBe(0)
  })

  it("is 0 when the roll probability is non-positive", () => {
    expect(averageBonus(hitTrain(60.7), 0, 60.7)).toBe(0)
  })

  it("lands near 0.087 at the parity build's roll probability (~0.3997)", () => {
    const bonus = averageBonus(hitTrain(60.7), 0.3997, 60.7)
    expect(bonus).toBeGreaterThan(0.086)
    expect(bonus).toBeLessThan(0.089)
  })

  it("lands near 0.0665 at a lower roll probability (0.15)", () => {
    const bonus = averageBonus(hitTrain(60.7), 0.15, 60.7)
    expect(bonus).toBeGreaterThan(0.065)
    expect(bonus).toBeLessThan(0.068)
  })

  it("a lower affinity rate yields a correspondingly smaller bonus", () => {
    const low = averageBonus(hitTrain(60.7), 0.15, 60.7)
    const high = averageBonus(hitTrain(60.7), 0.3997, 60.7)
    expect(low).toBeLessThan(high)
  })

  it("never exceeds the 5-stack cap, at any sampled time", () => {
    const tracker = trackerAfter(hitTrain(120, 0.05), 1)
    for (const timeSec of sampleTimes(120))
      expect(tracker.expectedStacksAt(timeSec)).toBeLessThanOrEqual(HAWKWING_MAX_STACKS)
    expect(averageBonus(hitTrain(120, 0.05), 1, 120)).toBeLessThanOrEqual(0.1)
  })

  it("holds a stack for five seconds after the roll that earned it, then drops it", () => {
    const tracker = trackerAfter([10], 1)
    expect(tracker.expectedStacksAt(10)).toBe(1)
    expect(tracker.expectedStacksAt(14.9)).toBe(1)
    expect(tracker.expectedStacksAt(15.1)).toBe(0)
  })

  it("reads a roll only from the moment it lands, so the event that rolls never reads its own stack", () => {
    const tracker = new HawkwingTracker(1, undefined, true)
    expect(tracker.expectedStacksAt(10)).toBe(0)
    tracker.roll(10, 1)
    expect(tracker.expectedStacksAt(10)).toBe(1)
    expect(tracker.expectedStacksAt(9.99)).toBe(0)
  })

  it("answers an earlier time from the state the rolls before it left", () => {
    const tracker = trackerAfter([1, 2, 3], 1)
    expect(tracker.expectedStacksAt(1.5)).toBe(1)
    expect(tracker.expectedStacksAt(2.5)).toBe(2)
    expect(tracker.expectedStacksAt(3.5)).toBe(3)
  })

  it("scales a roll that only part of the trajectories reach", () => {
    const tracker = new HawkwingTracker(1)
    tracker.roll(0, 0.5)
    const expected = tracker.expectedStacksAt(0)
    expect(expected).toBeGreaterThan(0.4)
    expect(expected).toBeLessThan(0.6)
  })
})

describe("HawkwingTracker streams", () => {
  const hits = hitTrain(60.7)

  it("averages 500 trajectories when given no rng, one fixed stream each", () => {
    const first = trackerAfter(hits, 0.4)
    const second = trackerAfter(hits, 0.4)
    const sampled = sampleTimes(60).map((timeSec) => first.expectedStacksAt(timeSec))
    expect(sampled.filter((stacks) => !Number.isInteger(stacks)).length).toBeGreaterThan(0)
    expect(sampleTimes(60).map((timeSec) => second.expectedStacksAt(timeSec))).toEqual(sampled)
  })

  it("runs a single trajectory when given an rng, and reproduces it from the same seed", () => {
    const sample = (seed: number) =>
      sampleTimes(60).map((timeSec) =>
        trackerAfter(hits, 0.4, mulberry32(seed)).expectedStacksAt(timeSec),
      )
    const firstSeed = sample(31)
    for (const stacks of firstSeed) {
      expect(Number.isInteger(stacks)).toBe(true)
      expect(stacks).toBeLessThanOrEqual(HAWKWING_MAX_STACKS)
    }
    expect(sample(31)).toEqual(firstSeed)
    expect(sample(32)).not.toEqual(firstSeed)
  })
})

const REFERENCE_SEED_OFFSET = 314
const REFERENCE_RUNS = 500
const REFERENCE_DECAY_SEC = 5

class SnapshotHawkwing {
  private readonly bank = new MulberryBank(REFERENCE_SEED_OFFSET, REFERENCE_RUNS)
  private readonly stacks = new Float64Array(REFERENCE_RUNS)
  private readonly lastStackSec = new Float64Array(REFERENCE_RUNS).fill(-Infinity)
  private readonly history: {
    timeSec: number
    stacks: Float64Array
    lastStackSec: Float64Array
  }[] = []

  constructor(
    private readonly procChance: number,
    private readonly keepHistory: boolean,
  ) {}

  roll(timeSec: number, occurrence: number): void {
    for (let sim = 0; sim < REFERENCE_RUNS; sim++) {
      if (occurrence < 1 && !(this.bank.next(sim) < occurrence)) continue
      if (this.stacks[sim] > 0 && timeSec - this.lastStackSec[sim] > REFERENCE_DECAY_SEC)
        this.stacks[sim] = 0
      if (this.bank.next(sim) < this.procChance) {
        this.stacks[sim] = Math.min(this.stacks[sim] + 1, HAWKWING_MAX_STACKS)
        this.lastStackSec[sim] = timeSec
      }
    }
    this.history.push({
      timeSec,
      stacks: this.stacks.slice(),
      lastStackSec: this.lastStackSec.slice(),
    })
  }

  expectedStacksAt(timeSec: number): number {
    const latest = this.history[this.history.length - 1]
    const earlier = this.history.filter((entry) => entry.timeSec <= timeSec)
    const snapshot =
      !latest || timeSec >= latest.timeSec || !this.keepHistory
        ? { stacks: this.stacks, lastStackSec: this.lastStackSec }
        : earlier[earlier.length - 1]
    if (!snapshot) return 0
    let total = 0
    for (let sim = 0; sim < REFERENCE_RUNS; sim++)
      if (snapshot.stacks[sim] > 0 && timeSec - snapshot.lastStackSec[sim] <= REFERENCE_DECAY_SEC)
        total += snapshot.stacks[sim]
    return total / REFERENCE_RUNS
  }
}

describe("HawkwingTracker against a per-roll snapshot reference", () => {
  const rollTimes: number[] = []
  const occurrences: number[] = []
  const timing = mulberry32(2024)
  for (let timeSec = 0.1, count = 0; count < 400; count++) {
    rollTimes.push(timeSec)
    occurrences.push(count % 7 === 3 ? 0.4 : 1)
    timeSec += timing() < 0.15 ? 0 : timing() * (timing() < 0.1 ? 9 : 0.6)
  }

  it.each([true, false])(
    "answers every query bit-identically (history kept: %s)",
    (keepHistory) => {
      const tracker = new HawkwingTracker(0.35, undefined, keepHistory)
      const reference = new SnapshotHawkwing(0.35, keepHistory)
      const queries = mulberry32(5)
      rollTimes.forEach((timeSec, index) => {
        tracker.roll(timeSec, occurrences[index]!)
        reference.roll(timeSec, occurrences[index]!)
        const queryTimes = [timeSec, timeSec + queries() * 12, queries() * timeSec]
        for (const queryTime of queryTimes)
          expect(tracker.expectedStacksAt(queryTime)).toBe(reference.expectedStacksAt(queryTime))
      })
    },
  )
})
