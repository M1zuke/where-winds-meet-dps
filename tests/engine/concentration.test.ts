import { describe, expect, it } from "vitest"
import { ConcentrationTracker, type ConcentrationRules } from "../../src/engine/buffs/concentration"
import type { MechanicObservedEvent } from "../../src/engine/mechanics/types"
import { mulberry32 } from "../../src/engine/rng"

const alwaysAffinity = (): number => 0

function rulesFor(overrides: Partial<ConcentrationRules> = {}): ConcentrationRules {
  return { focusPerAffinity: 15, chanceBonusWhileActive: 0, ...overrides }
}

function evenlySpaced(count: number, intervalSec: number, startSec = 0): number[] {
  return Array.from({ length: count }, (_unused, index) => startSec + index * intervalSec)
}

function observed(
  eventTimesSec: number[],
  options: {
    rules?: Partial<ConcentrationRules>
    affinityChance?: number
    random?: () => number
  } = {},
): ConcentrationTracker {
  const tracker = new ConcentrationTracker(rulesFor(options.rules), options.random)
  for (const timeSec of eventTimesSec)
    tracker.observe({ timeSec, occurrence: 1, affinityChance: options.affinityChance ?? 1 })
  return tracker
}

function activeAt(
  eventTimesSec: number[],
  timeSec: number,
  options: Parameters<typeof observed>[1] = {},
): number {
  return observed(eventTimesSec, { random: alwaysAffinity, ...options }).activeShareAtTime(timeSec)
}

const FOUR_HITS = [0, 0.5, 1, 1.5]

describe("ConcentrationTracker", () => {
  it("is always 0 before any event", () => {
    const tracker = new ConcentrationTracker(rulesFor())
    expect(tracker.activeShareAtTime(0)).toBe(0)
    expect(tracker.activeShareNow(30)).toBe(0)
  })

  it("is always 0 when no event can roll an affinity", () => {
    expect(activeAt(evenlySpaced(100, 0.5), 30, { affinityChance: 0 })).toBe(0)
  })

  it("keeps Concentration up under dense affinity hits", () => {
    const hits = evenlySpaced(120, 0.5)
    for (let timeSec = 2; timeSec < 59; timeSec += 0.5) {
      expect(activeAt(hits, timeSec)).toBe(1)
    }
  })

  it("lapses 10 s after the last refill, not the last hit", () => {
    const hits = [...FOUR_HITS, 2, 3]
    expect(activeAt(hits, 11.4)).toBe(1)
    expect(activeAt(hits, 11.6)).toBe(0)
  })

  it("does not refill within 3.1 s of a trigger", () => {
    const hitsToLastBeforeRefill = evenlySpaced(31, 0.1, 1.5)
    expect(activeAt([0, 0.5, 1, ...hitsToLastBeforeRefill], 11.6)).toBe(0)
    const withRefillHit = [0, 0.5, 1, ...hitsToLastBeforeRefill, 4.6]
    expect(activeAt(withRefillHit, 11.6)).toBe(1)
    expect(activeAt(withRefillHit, 14.7)).toBe(0)
  })

  it("keeps the decaying remainder across a lapse", () => {
    const hits = [...FOUR_HITS, 11.6, 11.7, 11.8]
    expect(activeAt(hits, 11.7)).toBe(0)
    expect(activeAt(hits, 12)).toBe(1)
  })

  it("decays between hits more than 3 s apart so a slow build-up never fills", () => {
    const hits = evenlySpaced(20, 6)
    for (let timeSec = 0; timeSec < 120; timeSec += 1) {
      expect(activeAt(hits, timeSec)).toBe(0)
    }
  })

  it("does not give the filling hit the buff, only the next hit", () => {
    expect(activeAt(FOUR_HITS, 1.5)).toBe(0)
    expect(activeAt(FOUR_HITS, 1.5 + 1 / 60)).toBe(1)
  })

  it("gives a hit on the same frame as the filling hit the buff when it resolves after it", () => {
    const tracker = observed([0, 0.5, 1])
    expect(tracker.activeShareNow(1.5)).toBe(0)
    tracker.observe({ timeSec: 1.5, occurrence: 1, affinityChance: 1 })
    expect(tracker.activeShareNow(1.5)).toBe(1)
  })

  it("fills a tier-below-4 bar in five hits of 10", () => {
    const hits = evenlySpaced(5, 0.5)
    const options = { rules: { focusPerAffinity: 10 } }
    expect(activeAt(hits, 1.9, options)).toBe(0)
    expect(activeAt(hits, 2.1, options)).toBe(1)
  })

  it("does not restart the decay delay on a hit while Focus is full", () => {
    expect(activeAt([...FOUR_HITS, 4], 11.6)).toBe(0)
  })

  it("restarts the decay delay on a hit that raises Focus without filling it", () => {
    expect(activeAt([0, 0.5, 3.4, 6.5], 6.6)).toBe(1)
  })

  it("lets Concentration's own direct affinity raise the roll chance while it is up", () => {
    const hits = evenlySpaced(40, 0.5)
    const sumUptime = (tracker: ConcentrationTracker) => {
      let total = 0
      for (let timeSec = 0; timeSec < 20; timeSec += 0.25)
        total += tracker.activeShareAtTime(timeSec)
      return total
    }
    const base = { affinityChance: 0.3, rules: { focusPerAffinity: 25 } }
    const withBonus = {
      affinityChance: 0.3,
      rules: { focusPerAffinity: 25, chanceBonusWhileActive: 0.2 },
    }
    expect(sumUptime(observed(hits, withBonus))).toBeGreaterThan(sumUptime(observed(hits, base)))
  })

  it("builds Focus at each event's own chance rather than one chance for the fight", () => {
    const hits = evenlySpaced(40, 0.5)
    const roll = (chances: number[]) => {
      const tracker = new ConcentrationTracker(rulesFor({ focusPerAffinity: 25 }))
      hits.forEach((timeSec, index) =>
        tracker.observe({
          timeSec,
          occurrence: 1,
          affinityChance: chances[index % chances.length]!,
        }),
      )
      return tracker.activeShareAtTime(19)
    }
    expect(roll([0.8])).toBeGreaterThan(roll([0.1]))
    expect(roll([0, 0, 0, 0.8])).toBeLessThan(roll([0.8]))
  })

  it("builds no Focus from an event that does not happen", () => {
    const tracker = new ConcentrationTracker(rulesFor(), alwaysAffinity)
    for (const timeSec of evenlySpaced(40, 0.5))
      tracker.observe({ timeSec, occurrence: 0, affinityChance: 1 })
    expect(tracker.activeShareAtTime(10)).toBe(0)
  })

  it("never exceeds 1", () => {
    const tracker = observed(evenlySpaced(2400, 0.05), { affinityChance: 0.7 })
    for (let timeSec = 0; timeSec <= 120; timeSec += 5) {
      expect(tracker.activeShareAtTime(timeSec)).toBeLessThanOrEqual(1)
      expect(tracker.activeShareNow(timeSec)).toBeLessThanOrEqual(1)
    }
  })
})

describe("ConcentrationTracker under a parse run", () => {
  const hits = evenlySpaced(200, 0.3)

  it("averages 500 runs when given no generator", () => {
    const tracker = observed(hits, { affinityChance: 0.4227 })
    const partial = Array.from({ length: 200 }, (_unused, step) =>
      tracker.activeShareAtTime(step * 0.3),
    ).filter((share) => share > 0 && share < 1)
    expect(partial.length).toBeGreaterThan(0)
  })

  it("runs a single trajectory when given a generator", () => {
    const tracker = observed(hits, { affinityChance: 0.4227, random: mulberry32(77) })
    for (let step = 0; step < 200; step++) {
      expect([0, 1]).toContain(tracker.activeShareAtTime(step * 0.3))
    }
  })

  it("follows the outcomes the run rolled instead of drawing its own", () => {
    const tracker = new ConcentrationTracker(rulesFor(), mulberry32(5))
    const event = (timeSec: number, rolledAffinity: boolean): MechanicObservedEvent => ({
      timeSec,
      occurrence: 1,
      affinityChance: 1,
      rolledAffinity,
    })
    for (const timeSec of FOUR_HITS) tracker.observe(event(timeSec, false))
    expect(tracker.activeShareAtTime(5)).toBe(0)
    for (const timeSec of [2, 2.5, 3, 3.5]) tracker.observe(event(timeSec, true))
    expect(tracker.activeShareAtTime(5)).toBe(1)
  })
})
