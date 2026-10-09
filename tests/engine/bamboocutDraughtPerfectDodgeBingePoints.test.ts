// Scoped to Bamboocut Draught's Perfect Dodge grant — the class carries no
// validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { classDefinition } from "../../src/definitions/classes/registry"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { WEAPON } from "../../src/data/skills/ids"
import type { RotationStep } from "../../src/engine/rotation"
import type { Result } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

const idlePad = makeSkill(CLASS, {
  name: "Test Idle",
  castFrames: 40,
  hits: [makeHit({ frame: 0 })],
})

const observer = makeSkill(CLASS, {
  name: "Test Observer",
  castFrames: 1,
  hits: [makeHit({ frame: 0 })],
})

// Draws the gauntlets for free, so a bare dodge step further down the
// rotation already has them drawn — matching every real rotation, where a
// dodge never opens on an undrawn weapon.
const gauntletsLead = makeSkill(CLASS, {
  name: "Test Gauntlets Lead",
  tags: [WEAPON.gauntlets],
  castFrames: 0,
  hits: [makeHit({ frame: 0 })],
})

function runDodges(steps: RotationStep[], inCarouse: boolean, bingePoints = 100) {
  const openingStacks: Record<string, number> = { [STATUS.bingePoints]: bingePoints }
  if (inCarouse) openingStacks[STATUS.carouse] = 1
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [idlePad, observer, gauntletsLead],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: gauntletsLead.id }),
        ...steps,
        makeStep({ skillId: observer.id }),
      ],
      openingStacks,
    }),
  })
}

function bingePointsAtObserver(result: Result): number {
  const observerCast = result.casts!.find((cast) => cast.skillName === "Test Observer")!
  return observerCast.buffs.find((buff) => buff.id === STATUS.bingePoints)?.stacks ?? 0
}

describe("Perfect Dodge Binge Points in Carouse", () => {
  it("one Perfect Dodge in Carouse raises Binge Points by 5 against the same rotation outside Carouse", () => {
    const withCarouse = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge })], true),
    )
    const withoutCarouse = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge })], false),
    )
    expect(withCarouse - withoutCarouse).toBe(5)
  })

  it("below Binge 100 it raises Binge Points by 0, even in Carouse", () => {
    const baseline = bingePointsAtObserver(runDodges([], true, 99))
    const afterDodge = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge })], true, 99),
    )
    expect(afterDodge - baseline).toBe(0)
  })

  it("outside Carouse it raises Binge Points by 0", () => {
    const baseline = bingePointsAtObserver(runDodges([], false))
    const afterDodge = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge })], false),
    )
    expect(afterDodge - baseline).toBe(0)
  })

  it("two dodges less than 60 frames apart grant 5 once, not twice", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterTwoDodges = bingePointsAtObserver(
      runDodges(
        [
          makeStep({ skillId: SKILL.perfectDodgeFull }),
          makeStep({ skillId: SKILL.perfectDodgeFull }),
        ],
        true,
      ),
    )
    expect(afterTwoDodges - baseline).toBe(5)
  })

  it("a Perfect Dodge[Full] followed by a Perfect Dodge inside 60 frames grants 5 once", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterTwoDodges = bingePointsAtObserver(
      runDodges(
        [makeStep({ skillId: SKILL.perfectDodgeFull }), makeStep({ skillId: SKILL.perfectDodge })],
        true,
      ),
    )
    expect(afterTwoDodges - baseline).toBe(5)
  })

  it("two dodges at least 60 frames apart grant twice", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterTwoDodges = bingePointsAtObserver(
      runDodges(
        [
          makeStep({ skillId: SKILL.perfectDodgeFull }),
          makeStep({ skillId: idlePad.id }),
          makeStep({ skillId: SKILL.perfectDodgeFull }),
        ],
        true,
      ),
    )
    expect(afterTwoDodges - baseline).toBe(10)
  })

  it("with the twin blades drawn instead of the gauntlets it grants 0", () => {
    const openingStacks: Record<string, number> = {
      [STATUS.bingePoints]: 100,
      [STATUS.carouse]: 1,
    }
    const twinBladesLead = makeSkill(CLASS, {
      name: "Test Twin Blades Lead",
      tags: [WEAPON.twinBlades],
      castFrames: 0,
      hits: [makeHit({ frame: 0 })],
    })
    const baseline = bingePointsAtObserver(
      runEngine({
        ...defaultInputs,
        classId: CLASS,
        set: null,
        customSkills: [twinBladesLead, observer],
        activeCustomRotation: makeRotation(CLASS, {
          steps: [makeStep({ skillId: twinBladesLead.id }), makeStep({ skillId: observer.id })],
          openingStacks,
        }),
      }),
    )
    const afterDodge = bingePointsAtObserver(
      runEngine({
        ...defaultInputs,
        classId: CLASS,
        set: null,
        customSkills: [twinBladesLead, observer],
        activeCustomRotation: makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: twinBladesLead.id }),
            makeStep({ skillId: SKILL.perfectDodge }),
            makeStep({ skillId: observer.id }),
          ],
          openingStacks,
        }),
      }),
    )
    expect(afterDodge - baseline).toBe(0)
  })

  it("the class's Deflect Cancel grants no Binge Points on a dummy — its talent needs a successful parry a dummy never attempts", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterDeflectCancel = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.deflectCancel })], true),
    )
    expect(afterDeflectCancel - baseline).toBe(0)
  })
})

describe("the class's dodge skills override the universal pair by id", () => {
  const classDef = classDefinition(CLASS)!

  it("carries exactly one skill per dodge id, and it is the class-owned one", () => {
    for (const dodgeId of [SKILL.perfectDodge, SKILL.perfectDodgeFull]) {
      const matches = classDef.skills.filter((skill) => skill.id === dodgeId)
      expect(matches).toHaveLength(1)
      expect(matches[0].classId).toBe(CLASS)
      expect(
        matches[0].hits[0].triggers.some((trigger) => trigger.targetId === STATUS.bingePoints),
      ).toBe(true)
    }
  })

  it("keeps the universal dodge's own Endurance cost and requirement", () => {
    for (const dodgeId of [SKILL.perfectDodge, SKILL.perfectDodgeFull]) {
      const skill = classDef.skills.find((candidate) => candidate.id === dodgeId)!
      expect(skill.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
      expect(skill.castConditions).toEqual([{ buffId: "meter:endurance", op: "gte", stacks: 15 }])
    }
  })
})
