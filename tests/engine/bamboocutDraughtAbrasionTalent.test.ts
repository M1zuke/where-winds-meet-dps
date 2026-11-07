// Scoped to Bamboocut Draught's "Increased Binge Point Gain" talent
// (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bamboocutDraught"

const eonpourTier1: typeof defaultInputs.mindMethods = [
  { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "1" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function damageWithBingePoints(skillId: string, bingePoints: number): number {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    precision: 0.7,
    mindMethods: eonpourTier1,
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
  const name = builtinSkill(CLASS, skillId).name
  return result.perSkill.find((row) => row.name === name)!.expectedDamage
}

describe("Increased Binge Point Gain removes Abrasion only while Binge Points is at least 200", () => {
  it.each([
    ["Dragonquench - Inebriate", SKILL.dragonquenchInebriate],
    ["Dragonquench - Inebriate [cancel]", SKILL.dragonquenchInebriateCancel],
    ["Dragonquench - Inebriate (3rd combo)", SKILL.dragonquenchInebriateThird],
  ])("%s deals more at 200 Binge Points than at 199", (_name, skillId) => {
    expect(damageWithBingePoints(skillId, 200)).toBeGreaterThan(damageWithBingePoints(skillId, 199))
  })

  it("no longer flags Dragonquench - Inebriate as never abrading", () => {
    expect(builtinSkill(CLASS, SKILL.dragonquenchInebriate).neverAbrades).toBeUndefined()
  })
})
