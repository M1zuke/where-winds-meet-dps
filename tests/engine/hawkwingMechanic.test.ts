import { describe, expect, it } from "vitest"
import { hawkwingMechanic } from "../../src/data/sets/hawkwingMechanic"
import { hawkwingStacksSchedule } from "../../src/engine/buffs/hawkwing"
import { SET_ID } from "../../src/data/sets/ids"
import { defaultInputs } from "../../src/engine/defaults"
import { mulberry32 } from "../../src/engine/rng"
import type { MechanicSetup } from "../../src/engine/mechanics/types"

const CLASS = "bellstrikeUmbra"

function setupWith(hitTimesSec: number[], dotTickTimesSec: number[]): MechanicSetup {
  return {
    inputs: { ...defaultInputs, classId: CLASS, set: SET_ID.hawkwing, directAffinityRate: 0 },
    classId: CLASS,
    fps: 60,
    rotationDurationSec: 10,
    hitTimesSec,
    weaponHitTimesSec: hitTimesSec,
    dotTickTimesSec,
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: false,
    effectiveRates: { precision: 1, critRate: 0, affinityRate: 1 },
    rng: mulberry32(1),
  }
}

describe("Hawkwing procs off a DoT tick, not only a cast hit", () => {
  it("ramps stacks from dotTickTimesSec alone when the rotation lands no direct hit", () => {
    const setup = setupWith([], [0.1, 0.2, 0.3, 0.4, 0.5])
    const state = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(setup)!

    const stacksAt = (timeSec: number) => state.schedule.getExpectedStacksAtTime(timeSec)
    expect(stacksAt(0.5)).toBeGreaterThan(0)
  })

  it("matches a schedule built from the merged, sorted hit and tick times", () => {
    const setup = setupWith([0.15, 0.45], [0.1, 0.2, 0.3, 0.4, 0.5])
    const state = hawkwingMechanic(SET_ID.hawkwing, "Hawkwing").prepare(setup)!

    const expectedSchedule = hawkwingStacksSchedule(
      [0.1, 0.15, 0.2, 0.3, 0.4, 0.45, 0.5],
      0.4,
      10,
      mulberry32(1),
    )
    for (let step = 0; step < 200; step++) {
      const timeSec = step * 0.05
      expect(state.schedule.getExpectedStacksAtTime(timeSec)).toBe(
        expectedSchedule.getExpectedStacksAtTime(timeSec),
      )
    }
  })
})
