// Scoped to Bamboocut Draught's Carouse gate — the class carries no
// validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BAMBOOCUT_DRAUGHT_GATES } from "../../src/data/classes/bamboocut-draught/gates"

const CLASS = "bamboocutDraught"

describe("a resource gate's cast chip carries its description", () => {
  it("the Carouse chip carries the gate's description text", () => {
    const carouseGate = BAMBOOCUT_DRAUGHT_GATES.find((gate) => gate.id === STATUS.carouse)!
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: SKILL.lightAttack, hitCount: 1 })],
        openingStacks: { [STATUS.carouse]: 1 },
      }),
    })
    const lightAttackCast = result.casts!.find(
      (cast) => cast.skillName === "Gauntlet Light Attack",
    )!
    const tag = lightAttackCast.buffs.find((buff) => buff.id === STATUS.carouse)!
    expect(tag.description).toBe(carouseGate.description)
  })
})
