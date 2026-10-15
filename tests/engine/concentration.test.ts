import { describe, expect, it } from "vitest"
import {
  concentrationActiveProbSchedule,
  type ConcentrationRules,
} from "../../src/engine/buffs/concentration"
import { mulberry32 } from "../../src/engine/rng"

const alwaysAffinity = (): number => 0

function rulesFor(
  eventTimesSec: number[],
  overrides: Partial<ConcentrationRules> = {},
): ConcentrationRules {
  return {
    eventTimesSec,
    rollProbability: 1,
    focusPerAffinity: 15,
    rollBonusWhileActive: 0,
    rollBonusWhileActiveAfterFirstDamage: 0,
    ...overrides,
  }
}

function evenlySpaced(count: number, intervalSec: number, startSec = 0): number[] {
  return Array.from({ length: count }, (_unused, index) => startSec + index * intervalSec)
}

function activeAt(rules: ConcentrationRules, timeSec: number): number {
  return concentrationActiveProbSchedule(rules, alwaysAffinity).getActiveProbAtTime(timeSec)
}

const FOUR_HITS = [0, 0.5, 1, 1.5]

describe("concentrationActiveProbSchedule", () => {
  it("is always 0 when there are no hits", () => {
    const schedule = concentrationActiveProbSchedule(rulesFor([]))
    expect(schedule.getActiveProbAtTime(0)).toBe(0)
    expect(schedule.getActiveProbAtTime(30)).toBe(0)
  })

  it("is always 0 when the roll probability is non-positive", () => {
    expect(activeAt(rulesFor(evenlySpaced(100, 0.5), { rollProbability: 0 }), 30)).toBe(0)
  })

  it("keeps Concentration up under dense affinity hits", () => {
    const rules = rulesFor(evenlySpaced(120, 0.5))
    for (let timeSec = 2; timeSec < 59; timeSec += 0.5) {
      expect(activeAt(rules, timeSec)).toBe(1)
    }
  })

  it("lapses 10 s after the last refill, not the last hit", () => {
    const rules = rulesFor([...FOUR_HITS, 2, 3])
    expect(activeAt(rules, 11.4)).toBe(1)
    expect(activeAt(rules, 11.6)).toBe(0)
  })

  it("does not refill within 3.1 s of a trigger", () => {
    const hitsToLastBeforeRefill = evenlySpaced(31, 0.1, 1.5)
    expect(activeAt(rulesFor([0, 0.5, 1, ...hitsToLastBeforeRefill]), 11.6)).toBe(0)
    const withRefillHit = rulesFor([0, 0.5, 1, ...hitsToLastBeforeRefill, 4.6])
    expect(activeAt(withRefillHit, 11.6)).toBe(1)
    expect(activeAt(withRefillHit, 14.7)).toBe(0)
  })

  it("keeps the decaying remainder across a lapse", () => {
    const rules = rulesFor([...FOUR_HITS, 11.6, 11.7, 11.8])
    expect(activeAt(rules, 11.7)).toBe(0)
    expect(activeAt(rules, 12)).toBe(1)
  })

  it("decays between hits more than 3 s apart so a slow build-up never fills", () => {
    const rules = rulesFor(evenlySpaced(20, 6))
    for (let timeSec = 0; timeSec < 120; timeSec += 1) {
      expect(activeAt(rules, timeSec)).toBe(0)
    }
  })

  it("does not give the filling hit the buff, only the next hit", () => {
    const rules = rulesFor(FOUR_HITS)
    expect(activeAt(rules, 1.5)).toBe(0)
    expect(activeAt(rules, 1.5 + 1 / 60)).toBe(1)
  })

  it("fills a tier-below-4 bar in five hits of 10", () => {
    const rules = rulesFor(evenlySpaced(5, 0.5), { focusPerAffinity: 10 })
    expect(activeAt(rules, 1.9)).toBe(0)
    expect(activeAt(rules, 2.1)).toBe(1)
  })

  it("does not restart the decay delay on a hit while Focus is full", () => {
    const rules = rulesFor([...FOUR_HITS, 4])
    expect(activeAt(rules, 11.6)).toBe(0)
  })

  it("restarts the decay delay on a hit that raises Focus without filling it", () => {
    const rules = rulesFor([0, 0.5, 3.4, 6.5])
    expect(activeAt(rules, 6.6)).toBe(1)
  })

  it("lets Concentration's own direct affinity raise the roll chance while it is up", () => {
    const hits = evenlySpaced(40, 0.5)
    const withoutBonus = rulesFor(hits, { rollProbability: 0.3, focusPerAffinity: 25 })
    const withBonus = rulesFor(hits, {
      rollProbability: 0.3,
      focusPerAffinity: 25,
      rollBonusWhileActive: 0.2,
    })
    const sumUptime = (rules: ConcentrationRules) => {
      const schedule = concentrationActiveProbSchedule(rules)
      let total = 0
      for (let timeSec = 0; timeSec < 20; timeSec += 0.25)
        total += schedule.getActiveProbAtTime(timeSec)
      return total
    }
    expect(sumUptime(withBonus)).toBeGreaterThan(sumUptime(withoutBonus))
  })

  it("never exceeds 1", () => {
    const schedule = concentrationActiveProbSchedule(
      rulesFor(evenlySpaced(2400, 0.05), { rollProbability: 0.7 }),
    )
    for (let timeSec = 0; timeSec <= 120; timeSec += 5) {
      expect(schedule.getActiveProbAtTime(timeSec)).toBeLessThanOrEqual(1)
    }
  })
})

describe("concentrationActiveProbSchedule under a parse run", () => {
  const hits = evenlySpaced(200, 0.3)
  const rules = rulesFor(hits, { rollProbability: 0.4227 })

  it("averages 500 runs when given no rng", () => {
    const schedule = concentrationActiveProbSchedule(rules)
    const partial = Array.from({ length: 200 }, (_unused, step) =>
      schedule.getActiveProbAtTime(step * 0.3),
    ).filter((probability) => probability > 0 && probability < 1)
    expect(partial.length).toBeGreaterThan(0)
  })

  it("runs a single trajectory when given an rng", () => {
    const schedule = concentrationActiveProbSchedule(rules, mulberry32(77))
    for (let step = 0; step < 200; step++) {
      expect([0, 1]).toContain(schedule.getActiveProbAtTime(step * 0.3))
    }
  })
})
