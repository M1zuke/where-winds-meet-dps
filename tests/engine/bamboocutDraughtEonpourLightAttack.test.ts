// Scoped to Bamboocut Draught's light attack under Eonpour (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, type Skill } from "../../src/engine/skill"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { lightAttack } from "../../src/data/skills/bamboocut-draught/light-attack"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

function eonpourAt(tier: number): Inputs["mindMethods"] {
  return [
    { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: String(tier) },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
}

const singleLanding = makeSkill(CLASS, {
  ...lightAttack,
  id: "test-light-attack-single-landing",
  hits: [lightAttack.hits[0]],
})

const closingLanding = makeSkill(CLASS, {
  ...lightAttack,
  id: "test-light-attack-closing-landing",
  hits: [lightAttack.hits[lightAttack.hits.length - 1]],
})

function runLightAttack(
  mindMethods: Inputs["mindMethods"],
  inCarouse: boolean,
  lightAttackSkill: Skill,
) {
  const openingStacks: Record<string, number> = {}
  if (inCarouse) openingStacks[STATUS.carouse] = 1
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    customSkills: [lightAttackSkill],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: lightAttackSkill.id })],
      openingStacks,
    }),
  })
}

function bingeMarksAfter(result: ReturnType<typeof runLightAttack>): number | undefined {
  const cast = result.casts!.find((castRow) => castRow.skillName === "Gauntlet Light Attack")!
  return cast.buffs.find((buff) => buff.id === STATUS.bingeMarks)?.stacks
}

describe("Eonpour light attack Binge Marks", () => {
  it("grants 2 extra Binge Marks per landing with Eonpour tier 1, none without", () => {
    const withEonpour = bingeMarksAfter(runLightAttack(eonpourAt(1), false, singleLanding))!
    const withoutEonpour = bingeMarksAfter(
      runLightAttack(defaultInputs.mindMethods, false, singleLanding),
    )!
    expect(withEonpour - withoutEonpour).toBe(2)
  })

  it("grants a Carouse top-up only from Eonpour tier 4, 3 on the stage that closes the chain", () => {
    const atTier1 = bingeMarksAfter(runLightAttack(eonpourAt(1), true, singleLanding))!
    const atTier3 = bingeMarksAfter(runLightAttack(eonpourAt(3), true, singleLanding))!
    const atTier4 = bingeMarksAfter(runLightAttack(eonpourAt(4), true, singleLanding))!
    expect(atTier3 - atTier1).toBe(0)
    expect(atTier4 - atTier1).toBe(1)

    const atTier1Closing = bingeMarksAfter(runLightAttack(eonpourAt(1), true, closingLanding))!
    const atTier4Closing = bingeMarksAfter(runLightAttack(eonpourAt(4), true, closingLanding))!
    expect(atTier4Closing - atTier1Closing).toBe(3)
  })
})
