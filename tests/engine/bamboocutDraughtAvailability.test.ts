// Scoped to Bamboocut Draught's cast availability (docs/TESTING.md § "Class
// scoping"); the class's anchor is bamboocutDraughtProfile.test.ts, so nothing
// here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { testRotation } from "../builtins"

const CLASS = "bamboocutDraught"

function illegalStepIndexes(skillIds: string[], bingePoints = 100): number[] {
  const inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  }
  const result = simulateTimeline(inputs, { collect: "full" })
  return (result.invalidStepIds ?? [])
    .map((stepId) => inputs.activeCustomRotation.steps.findIndex((step) => step.id === stepId))
    .sort((left, right) => left - right)
}

const { reveldrift, reveldriftCancel, realmplay, bladeAgainstWaves, tidepour, boundvessel } = SKILL
const longCast = SKILL.dragonquenchInebriate

describe("Reveldrift's two charges and its 3 s interval", () => {
  it("allows two casts and flags a third before a charge has recharged", () => {
    expect(illegalStepIndexes([reveldrift, longCast, reveldrift])).toEqual([])
    expect(illegalStepIndexes([reveldrift, longCast, reveldrift, longCast, reveldrift])).toEqual([
      4,
    ])
  })

  it("flags a second cast inside the 3 s interval", () => {
    expect(illegalStepIndexes([reveldriftCancel, reveldriftCancel])).toEqual([1])
  })

  it("spends one charge for the cancel form as for the full one", () => {
    expect(
      illegalStepIndexes([reveldriftCancel, longCast, reveldrift, longCast, reveldrift]),
    ).toEqual([4])
  })
})

describe("Empowered Light Attack", () => {
  it("opens Blade Against Waves and Tidepour after Realmplay, once each", () => {
    expect(illegalStepIndexes([realmplay, bladeAgainstWaves])).toEqual([])
    expect(illegalStepIndexes([realmplay, tidepour])).toEqual([])
    expect(illegalStepIndexes([realmplay, bladeAgainstWaves, tidepour])).toEqual([2])
  })

  it("flags Blade Against Waves and Tidepour without Realmplay", () => {
    expect(illegalStepIndexes([bladeAgainstWaves])).toEqual([0])
    expect(illegalStepIndexes([tidepour])).toEqual([0])
  })

  it("lapses after 1.1 s", () => {
    expect(illegalStepIndexes([realmplay, longCast, tidepour])).toEqual([2])
  })

  it("shuts Boundvessel while it holds", () => {
    expect(illegalStepIndexes([boundvessel])).toEqual([])
    expect(illegalStepIndexes([realmplay, boundvessel])).toEqual([1])
  })
})
