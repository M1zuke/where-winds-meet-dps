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

const FULL_CHAIN = 6

function runLightAttack(
  mindMethods: Inputs["mindMethods"],
  inCarouse: boolean,
  hitCount = FULL_CHAIN,
) {
  const openingStacks: Record<string, number> = {}
  if (inCarouse) openingStacks[STATUS.carouse] = 1
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.lightAttack, hitCount })],
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
    const withEonpour = bingePointsAfter(runLightAttack(eonpourAt(1), false, FULL_CHAIN - 1))!
    const withoutEonpour = bingePointsAfter(
      runLightAttack(defaultInputs.mindMethods, false, FULL_CHAIN - 1),
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
