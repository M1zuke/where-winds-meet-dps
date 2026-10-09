import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeStep } from "../../src/engine/rotation"
import { resolvedHitFrame, type Skill } from "../../src/engine/skill"
import type { Inputs } from "../../src/engine/types"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { PARAM } from "../../src/data/skills/buffs/ids"
import { CAST } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bamboocutDraught"

type Row = [phys: number, attribute: number, physFlat: number, attributeFlat: number]

const rowOf = (hit: Skill["hits"][number]): Row => [
  hit.physMultiplier,
  hit.attributeMultiplier,
  hit.physFixed,
  hit.attributeFixed,
]

interface ModuleCase {
  id: string
  castTag: string
  castFrames: number
  hits: { frame: number; row: Row }[]
}

const CASES: ModuleCase[] = [
  {
    id: SKILL.falconsPursuitTwinblades,
    castTag: CAST.falconsPursuitTwinblades,
    castFrames: 0,
    hits: [0, 1, 2].map(() => ({ frame: 0, row: [0.59136, 0.88704, 0, 0] as Row })),
  },
  {
    id: SKILL.twinbladeQuickDrink,
    castTag: CAST.twinbladeQuickDrink,
    castFrames: 41,
    hits: [{ frame: 18, row: [0, 0, 0, 0] }],
  },
  {
    id: SKILL.twinbladeQuickDrinkCancel,
    castTag: CAST.twinbladeQuickDrinkCancel,
    castFrames: 24,
    hits: [{ frame: 18, row: [0, 0, 0, 0] }],
  },
  {
    id: SKILL.bladeAgainstWaves,
    castTag: CAST.bladeAgainstWaves,
    castFrames: 54,
    hits: [
      { frame: 11, row: [0.315462, 0.473193, 87.6, 47.7] },
      { frame: 38, row: [0.736078, 1.104117, 204.4, 111.3] },
      { frame: 38, row: [0.736078, 1.104117, 204.4, 111.3] },
    ],
  },
  {
    id: SKILL.tidepour,
    castTag: CAST.tidepour,
    castFrames: 42,
    hits: [
      { frame: 10, row: [0.36636, 0.54954, 102, 55.5] },
      { frame: 24, row: [0.36636, 0.54954, 102, 55.5] },
    ],
  },
  {
    id: SKILL.gauntletsDash,
    castTag: CAST.gauntletsDash,
    castFrames: 36,
    hits: [{ frame: 20, row: [0.34392, 0.51588, 96, 52] }],
  },
  {
    id: SKILL.gauntletsDashTipsy,
    castTag: CAST.gauntletsDashTipsy,
    castFrames: 32,
    hits: [{ frame: 16, row: [0.34392, 0.51588, 96, 52] }],
  },
  {
    id: SKILL.twinbladesDual,
    castTag: CAST.twinbladesDual,
    castFrames: 45,
    hits: [
      { frame: 15, row: [0.36646, 0.54969, 102, 55.5] },
      { frame: 30, row: [0.36646, 0.54969, 102, 55.5] },
    ],
  },
]

const skyspeakTier6: Inputs["mindMethods"] = [
  { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function run(skills: Skill[], mindMethods = defaultInputs.mindMethods) {
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  })
}

describe.each(CASES)("user-placeable skill $id", (testCase) => {
  const skill = builtinSkill(CLASS, testCase.id)

  it("is registered with its cast tag, cast length and hit rows", () => {
    expect(skill.castTag).toBe(testCase.castTag)
    expect(skill.castFrames).toBe(testCase.castFrames)
    expect(skill.hits.map((hit) => hit.frame)).toEqual(testCase.hits.map((hit) => hit.frame))
    expect(skill.hits.map(rowOf)).toEqual(testCase.hits.map((hit) => hit.row))
  })

  it("is part of no built-in rotation", () => {
    for (const rotation of builtinRotationsForClass(CLASS)) {
      expect(rotation.steps.some((step) => step.skillId === testCase.id)).toBe(false)
    }
  })
})

describe("the twinblade drink", () => {
  const drink = builtinSkill(CLASS, SKILL.twinbladeQuickDrink)
  const drinkCancel = builtinSkill(CLASS, SKILL.twinbladeQuickDrinkCancel)
  const falcon = builtinSkill(CLASS, SKILL.falconsPursuitTwinblades)

  it("launches the 0.4 falcon at Qi rate 0.4", () => {
    expect(drink.hits[0]!.triggers.some((trigger) => trigger.targetId === falcon.id)).toBe(true)
    expect(falcon.triggerable).toBe(true)
    expect(falcon.hits.every((hit) => hit.qiRate === 0.4)).toBe(true)
  })

  it("is offered only with Skyspeak tier 4 and keeps its cancel form on the full form's hit", () => {
    const gate = [{ param: PARAM.skyspeak, minTier: 4 }]
    expect(drink.castConditions).toEqual(gate)
    expect(drinkCancel.castConditions).toEqual(gate)
    expect(drinkCancel.hits).toEqual(drink.hits)
    expect(drinkCancel.castFrames).toBeLessThan(drink.castFrames)
    expect(drinkCancel.breakdownName).toBe(drink.breakdownName)
  })

  it("deals falcon damage once placed with Skyspeak slotted", () => {
    const result = run([drink], skyspeakTier6)
    const falconRow = result.perSkill.find((entry) => entry.name === falcon.name)
    expect(falconRow?.expectedDamage).toBeGreaterThan(0)
  })
})

describe("Boundvessel with Skyspeak tier 4", () => {
  const boundvessel = builtinSkill(CLASS, SKILL.boundvessel)
  const cancel = builtinSkill(CLASS, SKILL.boundvesselDrinkCancel)

  it("banks Binge Points on the first finishing slash, 25 and a further 25 in Carouse", () => {
    const finishingSlash = boundvessel.hits.find((hit) => hit.id === "hit-12")!
    expect(finishingSlash.frame).toBe(144)
    expect(finishingSlash.triggers.map((trigger) => trigger.targetId)).toEqual([
      STATUS.skillBingePointAccumulation,
      STATUS.skillBingePointAccumulation,
    ])
    expect(finishingSlash.triggers.map((trigger) => trigger.stacks)).toEqual([25, 25])
    for (const trigger of finishingSlash.triggers) {
      expect(trigger.conditions).toContainEqual({ param: PARAM.skyspeak, minTier: 4 })
    }
  })

  it("has a drink cancel form that shares every hit and ends where the drink may interrupt", () => {
    expect(cancel.hits).toEqual(boundvessel.hits)
    expect(cancel.castFrames).toBe(175)
    expect(cancel.cancelledBy).toBe("nextSkill")
    expect(cancel.breakdownName).toBe(boundvessel.breakdownName)
  })
})

describe("Tidepour", () => {
  it("lands both bolts inside its cast on the dummy", () => {
    const tidepour = builtinSkill(CLASS, SKILL.tidepour)
    for (const bolt of tidepour.hits) {
      expect(bolt.projectile).toEqual({ speedMetersPerSecond: 32, maxTravelFrames: 24 })
      expect(resolvedHitFrame(bolt, () => false, 4)).toBeLessThanOrEqual(tidepour.castFrames)
    }
    const row = run([tidepour]).perSkill.find((entry) => entry.name === tidepour.name)
    expect(row?.expectedDamage).toBeGreaterThan(0)
  })
})

describe("the Tipsy dash", () => {
  it("is gated on the Tipsy threshold and the outside-Tipsy dash is not", () => {
    const tipsy = builtinSkill(CLASS, SKILL.gauntletsDashTipsy)
    const plain = builtinSkill(CLASS, SKILL.gauntletsDash)
    expect(tipsy.castConditions).toEqual([{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }])
    expect(plain.castConditions ?? []).toEqual([])
    expect(tipsy.breakdownName).toBe(plain.name)
  })
})

describe("Blade Against Waves", () => {
  it("needs Binge Points of 50 or more", () => {
    const skill = builtinSkill(CLASS, SKILL.bladeAgainstWaves)
    expect(skill.castConditions).toEqual([{ buffId: STATUS.bingePoints, op: "gt", stacks: 49 }])
  })
})

describe("the Twin Blades dual-weapon skill", () => {
  it("is a weapon swap placed on its own, like the other dual-weapon skills", () => {
    const dual = builtinSkill(CLASS, SKILL.twinbladesDual)
    expect(dual.isWeaponSwap).toBe(true)
    const result = run([builtinSkill(CLASS, SKILL.gauntletsDual), dual])
    expect(result.casts!.map((cast) => cast.skillName)).toEqual([
      builtinSkill(CLASS, SKILL.gauntletsDual).name,
      dual.name,
    ])
  })
})
