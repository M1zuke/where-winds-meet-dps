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

const lightAttackShortOfChainEnd = makeSkill(CLASS, {
  ...lightAttack,
  id: "test-light-attack-short-of-chain-end",
  hits: lightAttack.hits.slice(0, -1),
})

function runLightAttack(
  mindMethods: Inputs["mindMethods"],
  inCarouse: boolean,
  lightAttackSkill: Skill = lightAttack,
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

function bingePointsAfter(result: ReturnType<typeof runLightAttack>): number | undefined {
  const cast = result.casts!.find((c) => c.skillName === "Gauntlet Light Attack")!
  return cast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks
}

describe("Eonpour light attack Binge Points", () => {
  it("pays 5 Binge Points once the chain closes, with Eonpour slotted and none without", () => {
    const withEonpour = bingePointsAfter(runLightAttack(eonpourAt(1), false))!
    const withoutEonpour = bingePointsAfter(runLightAttack(defaultInputs.mindMethods, false))!
    expect(withEonpour - withoutEonpour).toBe(5)
  })

  it("pays nothing while the chain is still short of its closing stage", () => {
    const withEonpour = bingePointsAfter(
      runLightAttack(eonpourAt(1), false, lightAttackShortOfChainEnd),
    )!
    const withoutEonpour = bingePointsAfter(
      runLightAttack(defaultInputs.mindMethods, false, lightAttackShortOfChainEnd),
    )!
    expect(withEonpour - withoutEonpour).toBe(0)
  })

  it("pays a second helping in Carouse only from Eonpour tier 4", () => {
    const withoutEonpour = bingePointsAfter(runLightAttack(defaultInputs.mindMethods, true))!
    const atTier3 = bingePointsAfter(runLightAttack(eonpourAt(3), true))!
    const atTier4 = bingePointsAfter(runLightAttack(eonpourAt(4), true))!
    expect(atTier3 - withoutEonpour).toBe(5)
    expect(atTier4 - withoutEonpour).toBe(10)
  })
})
