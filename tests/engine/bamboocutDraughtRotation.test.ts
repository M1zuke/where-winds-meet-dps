// Scoped to Bamboocut Draught's built-in dummy rotation (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { dragonquenchInebriate } from "../../src/data/skills/bamboocut-draught/dragonquench-inebriate"
import { dragonquenchInebriateCancel } from "../../src/data/skills/bamboocut-draught/dragonquench-inebriate-cancel"
import { whaledraft } from "../../src/data/skills/bamboocut-draught/whaledraft"
import { quickDrink } from "../../src/data/skills/bamboocut-draught/quick-drink"
import { quickDrinkCancel } from "../../src/data/skills/bamboocut-draught/quick-drink-cancel"
import { reveldrift } from "../../src/data/skills/bamboocut-draught/reveldrift"
import { reveldriftCancel } from "../../src/data/skills/bamboocut-draught/reveldrift-cancel"
import { nightwickPrimepickFollowUp } from "../../src/data/skills/bamboocut-draught/nightwick-primepick-follow-up"
import { nightwickPrimepickFollowUpCancel } from "../../src/data/skills/bamboocut-draught/nightwick-primepick-follow-up-cancel"
import { peakfallPrepull } from "../../src/data/skills/bamboocut-draught/peakfall-prepull"
import { SKILL, DEBUFF, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"

// Manual mode: a fixed exhausted window from the fight's very first frame,
// deterministic regardless of these synthetic rotations' own damage.
const EXHAUSTED_FROM_START_COMBAT_SETTINGS = {
  ...defaultCombatSettings(),
  qiBreakOverride: { startSec: 0, durationSec: 10, lowQiLeadSec: 0 },
}

const CLASS = "bamboocutDraught"

function sumOfCoefficients(hits: readonly { physMultiplier: number; physFixed: number }[]): number {
  return hits.reduce((sum, hit) => sum + hit.physMultiplier + hit.physFixed, 0)
}

describe("the built-in Bamboocut Draught dummy rotation", () => {
  const classDef = classDefinition(CLASS)!

  it("every step resolves to a registered skill", () => {
    const rotation = classDef.rotations.find((r) => r.id === classDef.defaultRotationId)!
    const skillIds = new Set(classDef.skills.map((skill) => skill.id))
    for (const step of rotation.steps) {
      expect(skillIds.has(step.skillId), step.skillId).toBe(true)
    }
  })

  it("is the class default", () => {
    expect(classDef.defaultRotationId).toBe("builtin-bamboocutDraught-1m-dummy-windsfromcn")
    expect(classDef.rotations.some((r) => r.id === classDef.defaultRotationId)).toBe(true)
  })

  it("pays the Drunkslay echo out on the second, third and fourth Hero's Blood", () => {
    const rotation = classDef.rotations.find((r) => r.id === classDef.defaultRotationId)!
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: [
        { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "6" },
        { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
      activeCustomRotation: rotation,
      // Manual mode: this rotation's own authored break, so the frame
      // assertions below stay pinned to a known second.
      combatSettings: { ...defaultCombatSettings(), qiBreakOverride: rotation.qiBreak! },
      set: null,
    })
    const echoRow = result.perSkill.find((row) => row.name === "Drunkslay State")!
    expect(echoRow.count).toBe(3)
    const herosBloodFirstStrikeFrames = result
      .casts!.filter((cast) => cast.skillName === "Twinblade Special")
      .map((cast) => Math.round(cast.timeSec * 60) + 33)
    const echoFrames = result
      .timeline!.filter((event) => event.skillName === "Drunkslay State")
      .map((event) => event.frame)
    expect(echoFrames).toEqual(herosBloodFirstStrikeFrames.slice(1))
  })

  it("every hit of a rotation module lands inside its cast", () => {
    const rotation = classDef.rotations.find((r) => r.id === classDef.defaultRotationId)!
    const skillById = new Map(classDef.skills.map((skill) => [skill.id, skill] as const))
    for (const step of rotation.steps) {
      const skill = skillById.get(step.skillId)!
      if (skill.castFrames === 0) continue
      const effectiveCastFrames = Math.max(
        skill.castFrames,
        ...skill.hits.flatMap(
          (hit) => hit.variants?.map((variant) => variant.castFrames ?? 0) ?? [],
        ),
      )
      const maxHitFrame = Math.max(...skill.hits.map((hit) => hit.frame))
      expect(maxHitFrame, skill.id).toBeLessThan(effectiveCastFrames)
    }
  })
})

describe("a cancel form deals the full form's damage over a shorter cast", () => {
  it("Dragonquench - Inebriate [cancel] shares the full form's stages and breakdown name", () => {
    expect(sumOfCoefficients(dragonquenchInebriateCancel.hits)).toBe(
      sumOfCoefficients(dragonquenchInebriate.hits),
    )
    expect(dragonquenchInebriateCancel.castFrames).toBeLessThan(dragonquenchInebriate.castFrames)
    expect(dragonquenchInebriateCancel.breakdownName).toBe(dragonquenchInebriate.name)
  })
})

describe("a 1-hit cancel form", () => {
  it("Twinblade Q lands only the first Reveldrift hit over a shorter cast", () => {
    expect(reveldriftCancel.hits).toEqual([reveldrift.hits[0]])
    expect(reveldriftCancel.castFrames).toBeLessThan(reveldrift.castFrames)
    expect(reveldriftCancel.breakdownName).toBe(reveldrift.breakdownName)
  })

  it("Primepick Follow-up lands only the thrust over a shorter cast", () => {
    expect(nightwickPrimepickFollowUpCancel.hits).toEqual([nightwickPrimepickFollowUp.hits[0]])
    expect(nightwickPrimepickFollowUpCancel.castFrames).toBeLessThan(
      nightwickPrimepickFollowUp.castFrames,
    )
    expect(nightwickPrimepickFollowUpCancel.breakdownName).toBe(
      nightwickPrimepickFollowUp.breakdownName,
    )
  })
})

describe("the Perfect Quick Drink", () => {
  it("adds the perfect falcon to the drink's grants, which run before the Deepdaze check, over a shorter cast", () => {
    const drinkTargets = whaledraft.hits[0].triggers.map((trigger) => trigger.targetId)
    const perfectTargets = quickDrink.hits[0].triggers.map((trigger) => trigger.targetId)
    expect(drinkTargets.indexOf(STATUS.bingePoints)).toBeLessThan(
      drinkTargets.indexOf(STATUS.inebriateDeepdaze),
    )
    expect(drinkTargets).not.toContain(SKILL.falconsPursuit)
    expect(perfectTargets).toEqual([...drinkTargets, SKILL.falconsPursuit])
    expect(quickDrink.breakdownName).toBe(whaledraft.breakdownName)
  })

  it("has a cancel form with the same triggers over a shorter cast", () => {
    expect(quickDrinkCancel.hits[0].triggers).toBe(quickDrink.hits[0].triggers)
    expect(quickDrinkCancel.castFrames).toBeLessThan(quickDrink.castFrames)
    expect(quickDrinkCancel.breakdownName).toBe(quickDrink.breakdownName)
  })
})

describe("the Primepick follow-up", () => {
  const grantDeepdaze = makeSkill(CLASS, {
    name: "Test Deepdaze Granter",
    castFrames: 12,
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          makeTrigger({ kind: "applyBuff", targetId: STATUS.inebriateDeepdaze, stacks: 1 }),
        ],
      }),
    ],
  })

  function runFollowUp(withDeepdaze: boolean) {
    const steps = withDeepdaze
      ? [
          makeStep({ skillId: grantDeepdaze.id }),
          makeStep({ skillId: SKILL.nightwickPrimepickFollowUp }),
        ]
      : [makeStep({ skillId: SKILL.nightwickPrimepickFollowUp })]
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grantDeepdaze],
      activeCustomRotation: makeRotation(CLASS, { steps }),
      set: null,
    })
  }

  it("applies Wildstride and lands Nightwick - Primepick's single hit, Deepdaze or not", () => {
    for (const withDeepdaze of [true, false]) {
      const result = runFollowUp(withDeepdaze)

      const skillRow = result.perSkill.find((row) => row.breakdownName === "Nightwick - Primepick")!
      expect(skillRow.count).toBe(1)
      expect(result.buffWindows!.some((window) => window.id === DEBUFF.wildstride)).toBe(true)
    }
  })

  it("pins the hit's coefficients and frame", () => {
    expect(nightwickPrimepickFollowUp.hits).toHaveLength(1)
    const [hit] = nightwickPrimepickFollowUp.hits
    expect(hit.frame).toBe(20)
    expect(hit.physMultiplier).toBe(0.64565)
    expect(hit.physFixed).toBe(180)
    expect(hit.attributeMultiplier).toBe(0.968475)
    expect(hit.attributeFixed).toBe(98)
  })
})

describe("Peakfall on the Exhausted boss with Eonpour at tier 6", () => {
  const eonpourTier6: Inputs["mindMethods"] = [
    { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "6" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
  const grantDeepdaze = makeSkill(CLASS, {
    name: "Test Deepdaze Granter",
    castFrames: 12,
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          makeTrigger({ kind: "applyBuff", targetId: STATUS.inebriateDeepdaze, stacks: 1 }),
        ],
      }),
    ],
  })

  function runPeakfall(withEonpour: boolean, alreadyInDeepdaze: boolean, peakfalls = 1) {
    const steps = [
      ...(alreadyInDeepdaze ? [makeStep({ skillId: grantDeepdaze.id })] : []),
      ...Array.from({ length: peakfalls }, () => makeStep({ skillId: SKILL.peakfall })),
    ]
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grantDeepdaze],
      mindMethods: withEonpour ? eonpourTier6 : defaultInputs.mindMethods,
      activeCustomRotation: makeRotation(CLASS, { steps }),
      combatSettings: EXHAUSTED_FROM_START_COMBAT_SETTINGS,
      set: null,
    })
  }

  const deepdazeWindows = (result: ReturnType<typeof runEngine>) =>
    result.buffWindows!.filter((window) => window.id === STATUS.inebriateDeepdaze)

  it("fills Binge Points to 200 and enters Deepdaze through the threshold", () => {
    const result = runPeakfall(true, false)
    const peakfallCast = result.casts!.find((cast) => cast.skillName === "Gauntlet Q")!
    expect(peakfallCast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks).toBe(200)
    expect(deepdazeWindows(result)).toHaveLength(1)
  })

  it("extends a running Deepdaze by 6 s instead of opening a second one", () => {
    const result = runPeakfall(true, true)
    const windows = deepdazeWindows(result)
    expect(windows).toHaveLength(1)
    expect(windows[0].endSec - windows[0].startSec).toBeCloseTo(11, 1)
  })

  it("does nothing without Eonpour", () => {
    expect(deepdazeWindows(runPeakfall(false, false))).toHaveLength(0)
  })

  it("does not also fire Skyspeak's tier-3 grant on the same Exhausted hit that extends a running Deepdaze", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grantDeepdaze],
      mindMethods: [
        { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "6" },
        { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "3" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: grantDeepdaze.id }), makeStep({ skillId: SKILL.peakfall })],
      }),
      combatSettings: EXHAUSTED_FROM_START_COMBAT_SETTINGS,
      set: null,
    })
    const windows = deepdazeWindows(result)
    expect(windows).toHaveLength(1)
    expect(windows[0].endSec - windows[0].startSec).toBeCloseTo(11, 1)
  })

  it("shows its 60 s cooldown on the cast and blocks a second Peakfall inside it", () => {
    const result = runPeakfall(true, false, 2)
    const [first, second] = result.casts!.filter((cast) => cast.skillName === "Gauntlet Q")
    const cooldown = first.buffs.find((buff) => buff.id === STATUS.eonpourExhaustedCooldown)
    expect(cooldown?.remainingSec).toBeCloseTo(60, 0)
    expect(second.buffs.some((buff) => buff.id === STATUS.eonpourExhaustedCooldown)).toBe(true)
    expect(deepdazeWindows(result)).toHaveLength(1)
    expect(result.buffWindows!.filter((window) => window.id === DEBUFF.strayhunt)).toHaveLength(1)
  })

  it("Castlink on the Exhausted boss fires the same trigger and shares the 60 s cooldown", () => {
    const castlinkOnly = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: eonpourTier6,
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: SKILL.castlink })],
        openingStacks: { [STATUS.consecutivePunches]: 1 },
      }),
      combatSettings: EXHAUSTED_FROM_START_COMBAT_SETTINGS,
      set: null,
    })
    expect(deepdazeWindows(castlinkOnly)).toHaveLength(1)
    expect(
      castlinkOnly.buffWindows!.filter((window) => window.id === DEBUFF.strayhunt),
    ).toHaveLength(1)

    const peakfallThenCastlink = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: eonpourTier6,
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: SKILL.peakfall }), makeStep({ skillId: SKILL.castlink })],
      }),
      combatSettings: EXHAUSTED_FROM_START_COMBAT_SETTINGS,
      set: null,
    })
    expect(deepdazeWindows(peakfallThenCastlink)).toHaveLength(1)
    expect(
      peakfallThenCastlink.buffWindows!.filter((window) => window.id === DEBUFF.strayhunt),
    ).toHaveLength(1)
  })
})

describe("the pre-pull Peakfall", () => {
  it("sits before frame 0, opens Castlink, starts its cooldown and carries no Exhausted-window triggers", () => {
    expect(peakfallPrepull.prePull).toBe(true)
    expect(peakfallPrepull.castFrames).toBe(0)
    expect(peakfallPrepull.hits).toHaveLength(1)
    const [hit] = peakfallPrepull.hits
    expect(hit.triggers).toHaveLength(2)
    expect(hit.triggers.map((trigger) => trigger.targetId)).toEqual([
      STATUS.consecutivePunches,
      STATUS.peakfallCooldown,
    ])
    expect(hit.triggers.some((trigger) => trigger.targetId === STATUS.inebriateDeepdaze)).toBe(
      false,
    )
    expect(hit.triggers.some((trigger) => trigger.targetId === DEBUFF.wildstride)).toBe(false)
  })
})
