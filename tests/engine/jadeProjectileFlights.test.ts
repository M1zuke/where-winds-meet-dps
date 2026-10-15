// Scoped to the unvalidated Silkbind Jade class: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { fanlightcharged } from "../../src/data/skills/silkbind-jade/fanlightcharged"
import { fanspecial } from "../../src/data/skills/silkbind-jade/fanspecial"
import { umbq } from "../../src/data/skills/silkbind-jade/umbq"
import type { Inputs } from "../../src/engine/types"

const CLASS = "silkbindJade"
const NEAR_METERS = 3
const FAR_METERS = 18

function expectWithinAFrame(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(1)
}

function hitFrames(result: ReturnType<typeof simulateTimeline>, skillName: string): number[] {
  return (result.timeline ?? [])
    .filter((event) => event.kind === "hit" && event.skillName === skillName)
    .map((event) => event.frame)
}

function forsakenFameInputs(distanceMeters: number, gourdTossTier: number | null): Inputs {
  const steps =
    gourdTossTier === null
      ? [makeStep({ skillId: fanlightcharged.id })]
      : [makeStep({ skillId: fanspecial.id }), makeStep({ skillId: fanlightcharged.id })]
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: (gourdTossTier === null
      ? [emptyMindMethod, emptyMindMethod, emptyMindMethod, emptyMindMethod]
      : [
          { name: "gourdToss", stacks: `tier ${gourdTossTier}` },
          emptyMindMethod,
          emptyMindMethod,
          emptyMindMethod,
        ]) as Inputs["mindMethods"],
    activeCustomRotation: testRotation(CLASS, { steps, preferredDistanceMeters: distanceMeters }),
  }
}

function springSorrowInputs(blossomBarrageTier: number, distanceMeters: number): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    buffParams: { blossomBarrage: true, blossomBarrageTier },
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: umbq.id }), makeStep({ skillId: umbq.id })],
      preferredDistanceMeters: distanceMeters,
    }),
  }
}

describe("Forsaken Fame's whirlwind", () => {
  it("lands the moment it spawns on a target in the first 1.75 m", () => {
    const [frame] = hitFrames(
      simulateTimeline(forsakenFameInputs(NEAR_METERS, null), { collect: "full" }),
      fanlightcharged.name,
    )
    expectWithinAFrame(frame!, 71.4)
  })

  it("lands later the farther the target stands, at 20 m/s", () => {
    const [frame] = hitFrames(
      simulateTimeline(forsakenFameInputs(FAR_METERS, null), { collect: "full" }),
      fanlightcharged.name,
    )
    const closingMeters = FAR_METERS - 1.75 - 1.75
    expectWithinAFrame(frame!, 71.4 + (closingMeters / 20) * 60)
  })

  it("flies at 30 m/s under Flying Tornado", () => {
    const [frame] = hitFrames(
      simulateTimeline(forsakenFameInputs(FAR_METERS, 4), { collect: "full" }),
      fanlightcharged.name,
    )
    const closingMeters = FAR_METERS - 1.75 - 1.75
    expectWithinAFrame(frame!, fanspecial.castFrames + 60 + (closingMeters / 30) * 60)
  })
})

describe("Spring Sorrow", () => {
  const firstHit = (blossomBarrageTier: number, distanceMeters: number) =>
    hitFrames(
      simulateTimeline(springSorrowInputs(blossomBarrageTier, distanceMeters), {
        collect: "full",
      }),
      umbq.name,
    )[0]!

  it("fires its bullet at 46.08 f from Blossom Barrage rank 3 and at 59.8 f below it", () => {
    expectWithinAFrame(firstHit(6, NEAR_METERS), 46.08 + 0.9)
    expectWithinAFrame(firstHit(2, NEAR_METERS), 59.8 + 0.9)
  })

  it("lands later the farther the target stands, at 50 m/s", () => {
    const closingMeters = FAR_METERS - 1.75 - 0.5
    expectWithinAFrame(firstHit(6, FAR_METERS), 46.08 + (closingMeters / 50) * 60)
  })

  it("casts 67.31 f from rank 3 and 87.5 f below it, rounded up to the render frame", () => {
    const secondCastStartSec = (tier: number) =>
      simulateTimeline(springSorrowInputs(tier, NEAR_METERS), { collect: "full" }).casts![1]!
        .timeSec
    expect(secondCastStartSec(6) * 60).toBeCloseTo(Math.ceil(67.31), 5)
    expect(secondCastStartSec(2) * 60).toBeCloseTo(Math.ceil(87.5), 5)
  })
})
