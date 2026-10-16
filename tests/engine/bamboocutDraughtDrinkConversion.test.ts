// Scoped to Bamboocut Draught's chained drink (docs/TESTING.md § "Class
// scoping"); the class's anchor is bamboocutDraughtProfile.test.ts, so nothing
// here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { applyBuff } from "../../src/definitions/skills/triggers"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bamboocutDraught"
const FRAMES_PER_SECOND = 60

const bankBingePoints = makeSkill(CLASS, {
  name: "Test Binge Point Bank",
  castFrames: 1,
  hits: [
    makeHit({
      frame: 0,
      triggers: [applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25 })],
    }),
  ],
})

function deepdazeEntryFramesAfterDrinkStart(drinkId: string): number {
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    customSkills: [bankBingePoints],
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: bankBingePoints.id }), makeStep({ skillId: drinkId })],
      openingStacks: { [STATUS.bingePoints]: 190 },
    }),
  })
  const drinkName = builtinSkill(CLASS, drinkId).name
  const drinkCast = result.casts!.find((cast) => cast.skillName === drinkName)!
  const deepdaze = result.buffWindows!.find((window) => window.id === STATUS.inebriateDeepdaze)!
  return Math.round((deepdaze.startSec - drinkCast.timeSec) * FRAMES_PER_SECOND)
}

describe("the chained drink converts the banked Binge Points on its conversion frame", () => {
  it.each([
    ["the plain drink", SKILL.whaledraft],
    ["the perfect drink", SKILL.quickDrink],
    ["the perfect drink's cancel form", SKILL.quickDrinkCancel],
  ])("%s enters Deepdaze 19 frames in", (_name, drinkId) => {
    expect(deepdazeEntryFramesAfterDrinkStart(drinkId)).toBe(19)
  })
})
