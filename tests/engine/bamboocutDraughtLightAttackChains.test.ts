// Scoped to Bamboocut Draught's two light-attack chains (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { lightAttack } from "../../src/data/skills/bamboocut-draught/light-attack"
import { bloombreak } from "../../src/data/skills/bamboocut-draught/bloombreak"

const CLASS = "bamboocutDraught"

function runChain(skillId: string, bingePoints: number) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
}

function skillRow(result: ReturnType<typeof runChain>, breakdownName: string) {
  return result.perSkill.find((row) => row.breakdownName === breakdownName)
}

describe("the plain light-attack chain and Bloombreak are separate skills", () => {
  it("the plain chain has 8 damaging hits and unleashes Falcon's Pursuit", () => {
    const result = runChain(SKILL.lightAttack, 0)
    expect(skillRow(result, "Gauntlets Light Attack")?.count).toBe(8)
    expect(skillRow(result, "Whaledraft")).toBeDefined()
  })

  it("Bloombreak deals nothing below Binge 100", () => {
    const result = runChain(SKILL.bloombreak, 0)
    expect(skillRow(result, "Bloombreak")).toBeUndefined()
  })

  it("Bloombreak has 6 damaging hits at Binge 100 and unleashes no falcon", () => {
    const result = runChain(SKILL.bloombreak, 100)
    expect(skillRow(result, "Bloombreak")?.count).toBe(6)
    expect(skillRow(result, "Whaledraft")).toBeUndefined()
  })

  it("carries the coefficients of two distinct chains", () => {
    expect(lightAttack.hits).toHaveLength(8)
    expect(bloombreak.hits).toHaveLength(6)
    expect(lightAttack.castFrames).not.toBe(bloombreak.castFrames)
  })
})
