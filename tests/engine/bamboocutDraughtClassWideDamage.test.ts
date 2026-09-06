// Scoped to Bamboocut Draught — the class carries no validated anchor
// (docs/TESTING.md § "Class scoping"), so nothing here asserts an absolute
// DPS number. Covers the talent and ultimate bonuses that read "damage
// dealt" rather than naming the class's own skills.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

const CLASS = "bamboocutDraught"
const BREAKDOWN_NAME = "Flute Chanting a Thousand Waves"

function runFlute(openingStacks: Record<string, number>) {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: MYSTIC_SKILL.fluteOfTheTidesFull, hitCount: 2 })],
      openingStacks,
    }),
  })
  return result.perSkill.find((row) => row.breakdownName === BREAKDOWN_NAME)!.expectedDamage
}

describe("class-wide talent and ultimate bonuses reach every skill", () => {
  it("the Inebriate damage talent reaches a mystic art cast while Tipsy", () => {
    const withTipsy = runFlute({ [STATUS.bingePoints]: 100 })
    const withoutTipsy = runFlute({ [STATUS.bingePoints]: 0 })
    expect(withTipsy).toBeGreaterThan(withoutTipsy)
  })

  it("Clash-toast raises a mystic art's damage while it is up", () => {
    const withClashToast = runFlute({ [STATUS.clashToast]: 1 })
    const withoutClashToast = runFlute({})
    expect(withClashToast).toBeGreaterThan(withoutClashToast)
  })
})
