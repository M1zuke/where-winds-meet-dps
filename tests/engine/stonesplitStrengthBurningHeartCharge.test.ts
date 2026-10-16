// Burning Heart's charge: the stage the game releases from Blade Momentum read
// when the charge starts, the Blade Momentum spend at the release and the
// Endurance drain while the charge is held. Scoped to Stonesplit Strength.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { SKILL } from "../../src/data/skills/stonesplit-strength/ids"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import type { UnclaimedOddityNodes } from "../../src/engine/types"

const CLASS_ID = "stonesplitStrength"

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
  Jiangnan: [705, 719],
}

function run(skillIds: string[], customSkills: Skill[] = []) {
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS_ID,
    customSkills,
    customBuffs: [],
    set: null,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    activeCustomRotation: testRotation(CLASS_ID, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  })
}

const levelBeforeCast = (result: ReturnType<typeof run>, index: number, meterId: string) =>
  result.casts?.[index]?.meterLevels?.find((level) => level.id === meterId)?.amount

describe("Burning Heart's stage 2 charge", () => {
  it("releases stage 1 once Blade Momentum is no longer above 50 where the charge starts", () => {
    const result = run(Array<string>(5).fill(SKILL.phalanxchargedS2))
    expect(result.casts?.map((cast) => cast.skillName)).toEqual([
      "PhalanxCharged-S2",
      "PhalanxCharged-S2",
      "PhalanxCharged-S2",
      "PhalanxCharged-S1[Released]",
      "PhalanxCharged-S1[Released]",
    ])
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(
      result.warnings.some((warning) =>
        warning.includes("released onto PhalanxCharged-S1[Released]"),
      ),
    ).toBe(true)
  })

  it("spends its 50 Blade Momentum at the release, so the bar keeps regenerating until then", () => {
    const result = run([SKILL.phalanxchargedS2, SKILL.phalanxchargedS2])
    const afterOneCast = levelBeforeCast(result, 1, "bladeMomentum")!
    const castSec = (result.casts![1]!.timeSec - result.casts![0]!.timeSec) * 60
    const releaseFrame = 19.32 + 57
    expect(afterOneCast).toBeCloseTo(100 + (5 * (castSec - releaseFrame)) / 60, 0)
  })

  it("drains 5 Endurance a second while charging and holds regeneration for that stretch", () => {
    const spender = makeSkill(CLASS_ID, {
      name: "Spends Endurance",
      castFrames: 80,
      meterCosts: [{ meterId: enduranceMeter.id, amount: 40 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS_ID, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const withDrain = run([spender.id, SKILL.phalanxchargedS2, observer.id], [spender, observer])
    const regeneratingThroughout = run(
      [spender.id, SKILL.phalanxchargedS1, observer.id],
      [spender, observer],
    )
    const endurance = enduranceMeter.id
    const drained = levelBeforeCast(withDrain, 2, endurance)!
    const untouched = levelBeforeCast(regeneratingThroughout, 2, endurance)!
    const chargeSec = 57 / 60
    const lostToTheCharge = 5 * chargeSec + 10 * chargeSec
    const castDifferenceSec =
      withDrain.casts![2]!.timeSec -
      withDrain.casts![1]!.timeSec -
      (regeneratingThroughout.casts![2]!.timeSec - regeneratingThroughout.casts![1]!.timeSec)
    const regeneratedInLongerCast = 10 * castDifferenceSec
    expect(drained).toBeLessThan(untouched + regeneratedInLongerCast)
    expect(untouched + regeneratedInLongerCast - drained).toBeCloseTo(lostToTheCharge, 0)
  })
})

describe("Burning Heart with Inner Passion", () => {
  it("is charged above 25 Blade Momentum without Steadfast Devotion and releases stage 1 below it", () => {
    const result = run(Array<string>(12).fill(SKILL.phalanxchargedS2Innerpassion))
    const names = result.casts!.map((cast) => cast.skillName)
    expect(names[0]).toBe("PhalanxCharged-S2[InnerPassion]")
    expect(names).toContain("PhalanxCharged-S1[Released]")
    expect(result.invalidStepIds ?? []).toEqual([])
  })
})
