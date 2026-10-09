// Scoped to Bamboocut Draught's Consecutive Punches gate on Castlink
// (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"

const CLASS = "bamboocutDraught"

function runCastlink(consecutivePunches: number) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.castlink })],
      openingStacks: { [STATUS.consecutivePunches]: consecutivePunches },
    }),
  })
}

function castlinkHitCount(result: ReturnType<typeof runCastlink>): number {
  return result.perSkill.find((row) => row.breakdownName === "Castlink")?.count ?? 0
}

describe("Castlink requires Consecutive Punches", () => {
  it("lands nothing without Consecutive Punches held", () => {
    expect(castlinkHitCount(runCastlink(0))).toBe(0)
  })

  it("lands its hits when Consecutive Punches is held", () => {
    expect(castlinkHitCount(runCastlink(1))).toBeGreaterThan(0)
  })
})
