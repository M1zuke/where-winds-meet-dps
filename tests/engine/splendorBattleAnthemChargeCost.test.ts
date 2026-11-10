// Scoped to Bellstrike Splendor — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"

const CLASS = "bellstrikeSplendor"
const DRAIN_PER_SECOND = 40
const DRAIN_SECONDS = 1

const held = makeSkill(CLASS, {
  name: "Held Charge",
  castFrames: 90,
  meterDrains: [
    {
      meterId: enduranceMeter.id,
      perSecond: DRAIN_PER_SECOND,
      fromFrame: 0,
      stopAfterSec: DRAIN_SECONDS,
    },
  ],
  hits: [makeHit({ frame: 90, physMultiplier: 1, physFixed: 100 })],
})
const after = makeSkill(CLASS, {
  name: "After",
  castFrames: 6,
  hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
})

function enduranceAfterTheHold(battleAnthemTier?: number): number {
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    ...(battleAnthemTier === undefined
      ? {}
      : {
          mindMethods: [
            { name: "Battle Anthem", stacks: `tier ${battleAnthemTier}` },
            ...defaultInputs.mindMethods.slice(1),
          ] as typeof defaultInputs.mindMethods,
        }),
    customSkills: [held, after],
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: held.id }), makeStep({ skillId: after.id })],
    }),
  })
  const cast = result.casts!.find((entry) => entry.skillName === "After")!
  return cast.meterLevels!.find((level) => level.id === enduranceMeter.id)!.amount
}

describe("Battle Anthem's charged-hold Endurance cost", () => {
  const withoutBattleAnthem = enduranceAfterTheHold()

  it.each([4, 5])("raises the drain by 10%% at tier %i", (tier) => {
    const extra = DRAIN_PER_SECOND * DRAIN_SECONDS * 0.1
    expect(withoutBattleAnthem - enduranceAfterTheHold(tier)).toBeCloseTo(extra, 5)
  })

  it.each([1, 2, 3, 6])("leaves the drain unchanged at tier %i", (tier) => {
    expect(enduranceAfterTheHold(tier)).toBeCloseTo(withoutBattleAnthem, 5)
  })
})
