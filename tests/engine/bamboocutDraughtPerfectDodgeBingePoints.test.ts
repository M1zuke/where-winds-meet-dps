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
import type { RotationStep } from "../../src/engine/rotation"
import type { Result } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

const idlePad = makeSkill(CLASS, {
  name: "Test Idle",
  castFrames: 12,
  hits: [makeHit({ frame: 0 })],
})

const observer = makeSkill(CLASS, {
  name: "Test Observer",
  castFrames: 1,
  hits: [makeHit({ frame: 0 })],
})

function runDodges(steps: RotationStep[], inCarouse: boolean) {
  const openingStacks: Record<string, number> = {}
  if (inCarouse) openingStacks[STATUS.carouse] = 1
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [idlePad, observer],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [...steps, makeStep({ skillId: observer.id, hitCount: 1 })],
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
      runDodges([makeStep({ skillId: SKILL.perfectDodge, hitCount: 1 })], true),
    )
    const withoutCarouse = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge, hitCount: 1 })], false),
    )
    expect(withCarouse - withoutCarouse).toBe(5)
  })

  it("outside Carouse it raises Binge Points by 0", () => {
    const baseline = bingePointsAtObserver(runDodges([], false))
    const afterDodge = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.perfectDodge, hitCount: 1 })], false),
    )
    expect(afterDodge - baseline).toBe(0)
  })

  it("two dodges less than 60 frames apart grant 5 once, not twice", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterTwoDodges = bingePointsAtObserver(
      runDodges(
        [
          makeStep({ skillId: SKILL.perfectDodgeFull, hitCount: 1 }),
          makeStep({ skillId: SKILL.perfectDodgeFull, hitCount: 1 }),
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
        [
          makeStep({ skillId: SKILL.perfectDodgeFull, hitCount: 1 }),
          makeStep({ skillId: SKILL.perfectDodge, hitCount: 1 }),
        ],
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
          makeStep({ skillId: SKILL.perfectDodgeFull, hitCount: 1 }),
          makeStep({ skillId: idlePad.id, hitCount: 1 }),
          makeStep({ skillId: SKILL.perfectDodgeFull, hitCount: 1 }),
        ],
        true,
      ),
    )
    expect(afterTwoDodges - baseline).toBe(10)
  })

  it("the class's Deflect Cancel grants none", () => {
    const baseline = bingePointsAtObserver(runDodges([], true))
    const afterDeflectCancel = bingePointsAtObserver(
      runDodges([makeStep({ skillId: SKILL.deflectCancel, hitCount: 1 })], true),
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
})
