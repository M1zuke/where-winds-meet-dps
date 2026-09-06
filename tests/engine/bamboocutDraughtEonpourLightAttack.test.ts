// Scoped to Bamboocut Draught's light attack under Eonpour — the class
// carries no validated anchor (docs/TESTING.md § "Class scoping"), so
// nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
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

function runLightAttack(mindMethods: Inputs["mindMethods"], inCarouse: boolean) {
  const openingStacks: Record<string, number> = {}
  if (inCarouse) openingStacks[STATUS.carouse] = 1
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.lightAttack, hitCount: 1 })],
      openingStacks,
    }),
  })
}

function bingePointsAfter(result: ReturnType<typeof runLightAttack>): number | undefined {
  const cast = result.casts!.find((c) => c.skillName === "Gauntlet Light Attack")!
  return cast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks
}

describe("Eonpour light attack Binge Points", () => {
  it("a light attack landing grants 2 Binge Points with Eonpour slotted and none without", () => {
    const withEonpour = bingePointsAfter(runLightAttack(eonpourAt(1), false))!
    const withoutEonpour = bingePointsAfter(runLightAttack(defaultInputs.mindMethods, false))!
    expect(withEonpour - withoutEonpour).toBe(2)
  })

  it("the Carouse light-attack points need Eonpour tier 4", () => {
    const withoutEonpour = bingePointsAfter(runLightAttack(defaultInputs.mindMethods, true))!
    const atTier3 = bingePointsAfter(runLightAttack(eonpourAt(3), true))!
    const atTier4 = bingePointsAfter(runLightAttack(eonpourAt(4), true))!
    expect(atTier3 - withoutEonpour).toBe(2)
    expect(atTier4 - withoutEonpour).toBe(3)
  })
})
