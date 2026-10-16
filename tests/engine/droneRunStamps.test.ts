import { describe, expect, it } from "vitest"
import { absoluteDeadlineLatenessFrames } from "../../src/engine/dot"
import { WindowExtensionEnsemble } from "../../src/engine/buffs/windowExtension"
import {
  DRONE_FIRST_TICK_OFFSET_FRAMES,
  DRONE_INTERVAL_FRAMES,
} from "../../src/data/skills/silkbind-jade/droneTick"

const FPS = 60
const RUNS = 1100
const BASE_EXPIRY_SEC = 10
const COMBO = "combo"

const latenessMs = (runIndex: number) =>
  (absoluteDeadlineLatenessFrames(runIndex, DRONE_FIRST_TICK_OFFSET_FRAMES, DRONE_INTERVAL_FRAMES) *
    1000) /
  FPS

function extensionsPerRun(bulletOffsetsFrames: readonly number[]): number {
  const ensemble = new WindowExtensionEnsemble({
    buffIds: [COMBO],
    bySec: 1,
    maxRemainingSec: 1000,
  })
  const window = { start: 0, expiresAt: BASE_EXPIRY_SEC }
  for (let run = 0; run < RUNS; run++) {
    const gridFrame = DRONE_FIRST_TICK_OFFSET_FRAMES + run * DRONE_INTERVAL_FRAMES
    const lateness = absoluteDeadlineLatenessFrames(
      run,
      DRONE_FIRST_TICK_OFFSET_FRAMES,
      DRONE_INTERVAL_FRAMES,
    )
    for (const offset of bulletOffsetsFrames)
      ensemble.trigger(
        {
          timeSec: (gridFrame + offset) / FPS,
          stampSec: (gridFrame + offset + lateness) / FPS,
          runKey: null,
          latenessMaxSec: 0,
          conditionsHold: true,
          cooldownSec: 0.5,
          requiredWindowId: null,
        },
        () => window,
      )
  }
  const expiry =
    BASE_EXPIRY_SEC + ensemble.expectedRemainingSec(COMBO, 0, () => window) - BASE_EXPIRY_SEC
  return (expiry - BASE_EXPIRY_SEC) / RUNS
}

describe("floating umbrella run stamps", () => {
  it("fire a few milliseconds after their grid point, the first run 11 ms late", () => {
    expect(latenessMs(0)).toBeCloseTo(11, 9)
    expect([0, 1, 2, 3, 4, 5].map(latenessMs).map(Math.round)).toEqual([11, 6, 1, 29, 24, 19])
  })

  it("stay between zero and the 34 ms retry of the tick timer", () => {
    for (let run = 0; run < 500; run++) {
      expect(latenessMs(run)).toBeGreaterThanOrEqual(0)
      expect(latenessMs(run)).toBeLessThan(34)
    }
  })

  it("let 6 of every 11 single-bullet runs extend the Combo", () => {
    expect(extensionsPerRun([0])).toBeCloseTo(6 / 11, 3)
  })

  it("let 23 of every 33 runs extend when a Lingering Bone bullet follows 9 f later", () => {
    expect(extensionsPerRun([0, 9])).toBeCloseTo(23 / 33, 3)
  })
})

describe("the shipped Combo Extend Mark", () => {
  it("draws no random lateness", async () => {
    const { comboExtendMarkBuffDef } = await import("../../src/data/innerWays/blossomBarrageBuffs")
    expect(JSON.stringify(comboExtendMarkBuffDef())).not.toContain("lateness")
  })
})
