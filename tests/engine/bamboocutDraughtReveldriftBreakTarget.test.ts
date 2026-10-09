// Scoped to Bamboocut Draught's Reveldrift on the Qi-break target
// (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"

const CLASS = "bamboocutDraught"

function runReveldrift(onBreakTarget: boolean, bingePoints: number) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.reveldrift })],
      qiBreak: onBreakTarget
        ? { startSec: 0, durationSec: 10, lowQiLeadSec: 0 }
        : { startSec: 9999, durationSec: 0, lowQiLeadSec: 0 },
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
}

function bingePointsAfterCast(result: ReturnType<typeof runReveldrift>): number {
  const cast = result.casts!.find((castRow) => castRow.skillName === "Twinblade Q")!
  return cast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks ?? 0
}

describe("Reveldrift grants no Binge Points on the Qi-break target", () => {
  it("leaves Binge Points unchanged whether or not the target is broken", () => {
    const onBreak = bingePointsAfterCast(runReveldrift(true, 60))
    const offBreak = bingePointsAfterCast(runReveldrift(false, 60))
    expect(onBreak).toBe(60)
    expect(offBreak).toBe(60)
  })
})
