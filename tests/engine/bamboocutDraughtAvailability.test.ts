// Scoped to Bamboocut Draught's cast availability (docs/TESTING.md § "Class
// scoping"); the class's anchor is bamboocutDraughtProfile.test.ts, so nothing
// here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { importProfile } from "../../src/storage"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { testRotation } from "../builtins"
import profileFile from "./bamboocutDraughtMeasured.profile.json"

const CLASS = "bamboocutDraught"

function illegalStepIndexes(skillIds: string[], bingePoints = 100): number[] {
  const inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  }
  const result = simulateTimeline(inputs, { collect: "full" })
  return (result.invalidStepIds ?? [])
    .map((stepId) => inputs.activeCustomRotation.steps.findIndex((step) => step.id === stepId))
    .sort((left, right) => left - right)
}

const {
  reveldrift,
  reveldriftCancel,
  realmplay,
  bladeAgainstWaves,
  tidepour,
  boundvessel,
  nightwickPrimepick: tipsylay,
  nightwickPrimepickFollowUp: followUp,
  nightwickPrimepickFollowUpCancel: followUpCancel,
  nightwickGrounddrift: grounddrift,
  bladeVessel,
  dualBladesLightAttack1: twinbladeLightAttack,
  skystrikeGauntletsEx,
} = SKILL
const longCast = SKILL.dragonquenchInebriate

describe("Reveldrift's two charges and its 3 s interval", () => {
  it("allows two casts and flags a third before a charge has recharged", () => {
    expect(illegalStepIndexes([reveldrift, longCast, reveldrift])).toEqual([])
    expect(illegalStepIndexes([reveldrift, longCast, reveldrift, longCast, reveldrift])).toEqual([
      4,
    ])
  })

  it("flags a second cast inside the 3 s interval", () => {
    expect(illegalStepIndexes([reveldriftCancel, reveldriftCancel])).toEqual([1])
  })

  it("spends one charge for the cancel form as for the full one", () => {
    expect(
      illegalStepIndexes([reveldriftCancel, longCast, reveldrift, longCast, reveldrift]),
    ).toEqual([4])
  })
})

describe("Empowered Light Attack", () => {
  it("opens Blade Against Waves and Tidepour after Realmplay, once each", () => {
    expect(illegalStepIndexes([realmplay, bladeAgainstWaves])).toEqual([])
    expect(illegalStepIndexes([realmplay, tidepour])).toEqual([])
    expect(illegalStepIndexes([realmplay, bladeAgainstWaves, tidepour])).toEqual([2])
  })

  it("flags Blade Against Waves and Tidepour without Realmplay", () => {
    expect(illegalStepIndexes([bladeAgainstWaves])).toEqual([0])
    expect(illegalStepIndexes([tidepour])).toEqual([0])
  })

  it("lapses after 1.1 s", () => {
    expect(illegalStepIndexes([realmplay, longCast, tidepour])).toEqual([2])
  })

  it("shuts Boundvessel while it holds", () => {
    expect(illegalStepIndexes([boundvessel])).toEqual([])
    expect(illegalStepIndexes([realmplay, boundvessel])).toEqual([1])
  })
})

describe("Tipsylay and the Skystrike Gauntlets ultimate", () => {
  it("flags Tipsylay below 100 Binge Points", () => {
    expect(illegalStepIndexes([tipsylay], 60)).toEqual([0])
    expect(illegalStepIndexes([tipsylay], 100)).toEqual([])
  })

  it("holds Tipsylay for its 15 s cooldown", () => {
    expect(illegalStepIndexes([tipsylay, longCast, tipsylay])).toEqual([2])
    const sevenLongCasts = Array.from({ length: 7 }, () => longCast)
    expect(illegalStepIndexes([tipsylay, ...sevenLongCasts, tipsylay])).toEqual([])
  })

  it("holds the ultimate for its 60 s cooldown", () => {
    expect(illegalStepIndexes([skystrikeGauntletsEx, longCast, skystrikeGauntletsEx])).toEqual([2])
  })
})

describe("the Nightwick follow-up stance", () => {
  it.each([followUp, followUpCancel, grounddrift])(
    "%s needs Tipsylay and spends the stance",
    (skillId) => {
      expect(illegalStepIndexes([tipsylay, skillId])).toEqual([])
      expect(illegalStepIndexes([skillId])).toEqual([0])
      expect(illegalStepIndexes([tipsylay, skillId, skillId])).toEqual([2])
    },
  )

  it("lapses after 5 s", () => {
    const fiveSeconds = Array.from({ length: 2 }, () => longCast)
    expect(illegalStepIndexes([tipsylay, ...fiveSeconds, followUp])).toEqual([3])
  })
})

describe("Empowered Light Attack replaces the base light and heavy attacks", () => {
  it("flags the twin-blade light attack while Blade Against Waves is offered", () => {
    expect(illegalStepIndexes([twinbladeLightAttack])).toEqual([])
    expect(illegalStepIndexes([realmplay, twinbladeLightAttack])).toEqual([1])
    expect(illegalStepIndexes([realmplay, twinbladeLightAttack], 40)).toEqual([])
  })

  it("flags Blade Vessel while Tipsy or while Tidepour is offered", () => {
    expect(illegalStepIndexes([bladeVessel], 60)).toEqual([])
    expect(illegalStepIndexes([bladeVessel], 100)).toEqual([0])
    expect(illegalStepIndexes([realmplay, bladeVessel], 60)).toEqual([1])
    expect(illegalStepIndexes([realmplay, bladeVessel], 40)).toEqual([])
  })
})

describe("the built-in dummy rotation", () => {
  it("casts nothing the game would refuse", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const inputs = applyBowSet(applyArmorSet(withDerivedStats(profile.inputs)))
    const result = simulateTimeline(inputs, { collect: "full" })
    expect(result.invalidStepIds ?? []).toEqual([])
  })
})
