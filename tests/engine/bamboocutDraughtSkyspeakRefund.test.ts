// Scoped to Bamboocut Draught's Deepdaze-end refund — the class carries no
// validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

// Long enough that the sim outlives Deepdaze's 5 s window and its onExpire
// reset gets processed before the cast's own buff snapshot is queried.
const grantDeepdaze = makeSkill(CLASS, {
  name: "Test Deepdaze Entry",
  castFrames: 400,
  hits: [
    makeHit({
      frame: 0,
      triggers: [
        makeTrigger({ kind: "applyBuff", targetId: STATUS.inebriateDeepdaze, stacks: 1 }),
        // A zero-stack grant still opens Binge Points' permanent window, so its
        // later value is visible on the cast even though it opens at 0.
        makeTrigger({ kind: "applyBuff", targetId: STATUS.bingePoints, stacks: 0 }),
      ],
    }),
  ],
})

function runExpiry(mindMethods: Inputs["mindMethods"]) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    customSkills: [grantDeepdaze],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: grantDeepdaze.id, hitCount: 1 })],
      openingStacks: { [STATUS.bingePoints]: 0 },
    }),
  })
}

function bingePointsAfter(result: ReturnType<typeof runExpiry>): number | undefined {
  const cast = result.casts!.find((c) => c.skillName === "Test Deepdaze Entry")!
  return cast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks
}

describe("the Deepdaze-end refund", () => {
  it("needs Skyspeak; without it Deepdaze ends at 0 Binge Points", () => {
    const withoutSkyspeak = bingePointsAfter(runExpiry(defaultInputs.mindMethods))
    const withSkyspeak = bingePointsAfter(
      runExpiry([
        { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "1" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ]),
    )
    expect(withoutSkyspeak).toBe(0)
    expect(withSkyspeak).toBe(60)
  })
})
