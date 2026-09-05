// Scoped to Bamboocut Draught's built-in dummy rotation — the class carries
// no validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
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
import { peakfallPrepull } from "../../src/data/skills/bamboocut-draught/peakfall-prepull"
import { SKILL, DEBUFF, STATUS } from "../../src/data/skills/bamboocut-draught/ids"

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
    expect(classDef.defaultRotationId).toBe("builtin-bamboocutDraught-dummy-rotation")
    expect(classDef.rotations.some((r) => r.id === classDef.defaultRotationId)).toBe(true)
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

describe("Twinblade Q [1-hit cancel]", () => {
  it("lands only the first Reveldrift hit over a shorter cast", () => {
    expect(reveldriftCancel.hits).toEqual([reveldrift.hits[0]])
    expect(reveldriftCancel.castFrames).toBeLessThan(reveldrift.castFrames)
    expect(reveldriftCancel.breakdownName).toBe(reveldrift.breakdownName)
  })
})

describe("the Perfect Quick Drink", () => {
  it("adds the perfect falcon to the drink's grants, which run before the Deepdaze check, over a shorter cast", () => {
    const drinkTargets = whaledraft.hits[0].triggers.map((trigger) => trigger.targetId)
    const perfectTargets = quickDrink.hits[0].triggers.map((trigger) => trigger.targetId)
    expect(drinkTargets.indexOf(STATUS.bingePoints)).toBeLessThan(drinkTargets.indexOf(STATUS.inebriateDeepdaze))
    expect(drinkTargets).not.toContain(SKILL.falconsPursuitPerfect)
    expect(perfectTargets).toEqual([...drinkTargets, SKILL.falconsPursuitPerfect])
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
          makeStep({ skillId: grantDeepdaze.id, hitCount: 1 }),
          makeStep({ skillId: SKILL.nightwickPrimepickFollowUp, hitCount: 2 }),
        ]
      : [makeStep({ skillId: SKILL.nightwickPrimepickFollowUp, hitCount: 2 })]
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grantDeepdaze],
      activeCustomRotation: makeRotation(CLASS, { steps }),
      set: null,
    })
  }

  it("applies Wildstride on its thrust and lands the Tri-strike only in Deepdaze", () => {
    const withDeepdaze = runFollowUp(true)
    const withoutDeepdaze = runFollowUp(false)

    const rowIn = (result: ReturnType<typeof runEngine>) =>
      result.perSkill.find((row) => row.breakdownName === "Nightwick - Primepick")!

    expect(rowIn(withDeepdaze).count).toBe(2)
    expect(rowIn(withoutDeepdaze).count).toBe(1)

    for (const result of [withDeepdaze, withoutDeepdaze]) {
      expect(result.buffWindows!.some((window) => window.id === DEBUFF.wildstride)).toBe(true)
    }
  })
})

describe("the pre-pull Peakfall", () => {
  it("sits before frame 0 and carries no Exhausted-window triggers", () => {
    expect(peakfallPrepull.prePull).toBe(true)
    expect(peakfallPrepull.castFrames).toBe(0)
    expect(peakfallPrepull.hits).toHaveLength(1)
    expect(peakfallPrepull.hits[0].triggers).toHaveLength(0)
  })
})
