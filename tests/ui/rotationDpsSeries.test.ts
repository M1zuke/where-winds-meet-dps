import { describe, it, expect } from "vitest"
import { dpsSeries } from "../../src/ui/features/rotation/rotation-dps-graph-panel/dpsSeries"
import type { Result, TimelineEvent } from "../../src/engine/types"

function event(timeSec: number, damage: number, inWindow = true): TimelineEvent {
  return {
    frame: Math.round(timeSec * 60),
    timeSec,
    skillName: "Test Skill",
    type: "weapon",
    kind: "hit",
    damage,
    inWindow,
  }
}

function resultWith(timeline: TimelineEvent[], rotationDuration: number): Result {
  const totalDamage = timeline
    .filter((entry) => entry.inWindow)
    .reduce((sum, entry) => sum + entry.damage, 0)
  return {
    dps: rotationDuration > 0 ? totalDamage / rotationDuration : 0,
    totalDamage,
    rotationDuration,
    graduationRate: null,
    perSkill: [],
    ranking: [],
    warnings: [],
    timeline,
  }
}

describe("dpsSeries", () => {
  it("plots both series on the same whole-second points, starting from zero", () => {
    const { perSecond, cumulative } = dpsSeries(resultWith([event(0.5, 100), event(2.5, 100)], 4))

    expect(perSecond.map((sample) => sample.timeSec)).toEqual([0, 1, 2, 3, 4])
    expect(cumulative.map((sample) => sample.timeSec)).toEqual([0, 1, 2, 3, 4])
    expect(perSecond[0].dps).toBe(0)
    expect(cumulative[0].dps).toBe(0)
  })

  it("reads per-second as that second's own damage and cumulative as the damage so far", () => {
    const { perSecond, cumulative } = dpsSeries(resultWith([event(1, 100), event(2, 100)], 3))

    expect(perSecond.map((sample) => sample.dps)).toEqual([0, 100, 100, 0])
    expect(cumulative.map((sample) => sample.dps)).toEqual([0, 100, 100, 200 / 3])
  })

  it("peaks per-second at the second the damage actually lands in", () => {
    const { perSecond } = dpsSeries(resultWith([event(1, 100), event(3, 900)], 4))

    const peak = perSecond.reduce((best, sample) => (sample.dps > best.dps ? sample : best))
    expect(peak.timeSec).toBe(3)
    expect(peak.dps).toBe(900)
  })

  it("closes the cumulative series on the rotation's own DPS", () => {
    const result = resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4)
    const { cumulative } = dpsSeries(result)

    expect(cumulative[cumulative.length - 1].dps).toBeCloseTo(result.dps, 10)
  })

  it("merges a part-second tail into the last full second rather than spiking on it", () => {
    const { perSecond } = dpsSeries(resultWith([event(1, 100), event(2, 300)], 2.5))

    expect(perSecond.map((sample) => sample.timeSec)).toEqual([0, 1, 2.5])
    expect(perSecond[2].dps).toBeCloseTo(200, 10)
  })

  it("credits pre-pull and zero-time damage to the first second, never to the zero point", () => {
    const { perSecond } = dpsSeries(resultWith([event(-2, 50), event(0, 150), event(1, 100)], 4))

    expect(perSecond[0]).toEqual({ timeSec: 0, dps: 0 })
    expect(perSecond[1]).toEqual({ timeSec: 1, dps: 300 })
  })

  it("leaves out damage the rotation does not count", () => {
    const counted = dpsSeries(resultWith([event(1, 100), event(2, 300)], 4))
    const withIgnored = dpsSeries(
      resultWith([event(1, 100), event(1.5, 9999, false), event(2, 300)], 4),
    )

    expect(withIgnored).toEqual(counted)
  })

  it("buckets by time even when the timeline is not sorted", () => {
    const { perSecond } = dpsSeries(resultWith([event(3, 300), event(1, 100), event(2, 200)], 3))

    expect(perSecond.map((sample) => sample.dps)).toEqual([0, 100, 200, 300])
  })

  it("has nothing to plot without a duration or in-window damage", () => {
    const empty = { perSecond: [], cumulative: [] }
    expect(dpsSeries(resultWith([event(1, 100)], 0))).toEqual(empty)
    expect(dpsSeries(resultWith([event(1, 100, false)], 4))).toEqual(empty)
    expect(dpsSeries(resultWith([], 4))).toEqual(empty)
  })
})
