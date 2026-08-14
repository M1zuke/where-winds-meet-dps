import { describe, it, expect } from "vitest"
import { runningDpsSeries } from "../../src/ui/features/rotation/rotation-dps-graph-panel/dpsSeries"
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

describe("runningDpsSeries", () => {
  it("ends at the rotation's own DPS", () => {
    const result = resultWith([event(1, 100), event(2, 300), event(4, 200)], 8)
    const samples = runningDpsSeries(result)

    expect(samples[samples.length - 1].timeSec).toBe(8)
    expect(samples[samples.length - 1].dps).toBeCloseTo(result.dps, 10)
  })

  it("divides cumulative damage by elapsed time at each point", () => {
    const samples = runningDpsSeries(resultWith([event(1, 100), event(2, 300)], 2))

    expect(samples.map((sample) => sample.timeSec)).toEqual([1, 2])
    expect(samples[0].dps).toBeCloseTo(100, 10)
    expect(samples[1].dps).toBeCloseTo(200, 10)
  })

  it("leaves out damage the rotation does not count", () => {
    const counted = runningDpsSeries(resultWith([event(1, 100), event(2, 300)], 4))
    const withIgnored = runningDpsSeries(
      resultWith([event(1, 100), event(1.5, 9999, false), event(2, 300)], 4),
    )

    expect(withIgnored).toEqual(counted)
  })

  it("credits pre-pull and zero-time damage to the first plotted point", () => {
    const samples = runningDpsSeries(resultWith([event(-2, 50), event(0, 150), event(1, 100)], 4))

    expect(samples[0]).toEqual({ timeSec: 1, dps: 300 })
  })

  it("emits one point per distinct time when hits land together", () => {
    const samples = runningDpsSeries(resultWith([event(1, 100), event(1, 200), event(2, 300)], 2))

    expect(samples.map((sample) => sample.timeSec)).toEqual([1, 2])
    expect(samples[0].dps).toBeCloseTo(300, 10)
  })

  it("orders points by time even when the timeline is not sorted", () => {
    const samples = runningDpsSeries(resultWith([event(3, 300), event(1, 100), event(2, 200)], 3))

    expect(samples.map((sample) => sample.timeSec)).toEqual([1, 2, 3])
  })

  it("has nothing to plot without a duration or in-window damage", () => {
    expect(runningDpsSeries(resultWith([event(1, 100)], 0))).toEqual([])
    expect(runningDpsSeries(resultWith([event(1, 100, false)], 4))).toEqual([])
    expect(runningDpsSeries(resultWith([], 4))).toEqual([])
  })
})
