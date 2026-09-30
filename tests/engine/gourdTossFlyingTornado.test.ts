// Scoped to Silkbind Jade — CLAUDE.md § "Implemented classes" lists it
// unvalidated, but its engine wiring is still under test.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { fanspecial } from "../../src/data/skills/silkbind-jade/fanspecial"
import { fanlightcharged } from "../../src/data/skills/silkbind-jade/fanlightcharged"
import type { Inputs } from "../../src/engine/types"

const CLASS = "silkbindJade"

function inputsWithGourdToss(tier: number | null): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: (tier === null
      ? [emptyMindMethod, emptyMindMethod, emptyMindMethod, emptyMindMethod]
      : [
          { name: "gourdToss", stacks: `tier ${tier}` },
          emptyMindMethod,
          emptyMindMethod,
          emptyMindMethod,
        ]) as Inputs["mindMethods"],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: fanspecial.id }), makeStep({ skillId: fanlightcharged.id })],
    }),
  }
}

function forsakenFameHitFrame(timeline: ReturnType<typeof simulateTimeline>): number {
  const hits = (timeline.timeline ?? []).filter(
    (event) => event.kind === "hit" && event.skillName === fanlightcharged.name,
  )
  expect(hits).toHaveLength(1)
  return hits[0]!.frame
}

describe("Gourd Toss rank 4+ — Flying Tornado accelerates Forsaken Fame", () => {
  it("without Gourd Toss, Forsaken Fame keeps its normal charge timing", () => {
    const result = simulateTimeline(inputsWithGourdToss(null), { collect: "full" })
    expect(forsakenFameHitFrame(result)).toBe(fanspecial.castFrames + 71)
  })

  it("below rank 4, Forsaken Fame keeps its normal charge timing", () => {
    const result = simulateTimeline(inputsWithGourdToss(3), { collect: "full" })
    expect(forsakenFameHitFrame(result)).toBe(fanspecial.castFrames + 71)
  })

  it("at rank 4+, Forsaken Fame's whirlwind lands 11 frames earlier and the cast is shorter", () => {
    const withTornado = simulateTimeline(inputsWithGourdToss(4), { collect: "full" })
    const without = simulateTimeline(inputsWithGourdToss(null), { collect: "full" })
    expect(forsakenFameHitFrame(withTornado)).toBe(fanspecial.castFrames + 60)
    expect(withTornado.rotationDuration).toBeLessThan(without.rotationDuration)
  })
})
