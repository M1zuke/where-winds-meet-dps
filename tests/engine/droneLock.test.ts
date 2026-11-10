// Scoped to Silkbind Jade's floating umbrella.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import { DEBUFF, SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { DRONE_LOCK } from "../../src/data/skills/silkbind-jade/droneTick"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { testRotation } from "../builtins"

const DRONE_ROW = "UmbDrone[20hit] (DoT)"
const FAN_CASTS = 5

function run(finalSkillId: string, launchSkillId = SKILL.umbdronelaunch20Hit) {
  const rotation = testRotation("silkbindJade", {
    steps: [
      launchSkillId,
      ...Array.from({ length: FAN_CASTS }, () => SKILL.fanspecial),
      finalSkillId,
      SKILL.fanspecial,
    ].map((skillId) => makeStep({ skillId })),
  })
  const result = simulateTimeline({
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
  })
  const ticks = (result.timeline ?? []).filter((event) => event.skillName === DRONE_ROW)
  const flaggedStepIndexes = Object.entries(result.invalidStepReasons ?? {})
    .filter(([, reasons]) => reasons.some((reason) => reason.kind === "debuff"))
    .map(([stepId]) => rotation.steps.findIndex((step) => step.id === stepId))
  return { result, ticks, flaggedStepIndexes }
}

describe("the fixed-count floating umbrella", () => {
  it("keeps ticking through an umbrella cast, which only flags the cast", () => {
    const fanOnly = run(SKILL.fanspecial)
    const umbrellaCast = run(SKILL.umblightcharge)
    expect(umbrellaCast.ticks.length).toBeGreaterThanOrEqual(fanOnly.ticks.length)
    expect(fanOnly.flaggedStepIndexes).toEqual([])
    expect(umbrellaCast.flaggedStepIndexes).toEqual([FAN_CASTS + 1])
  })

  it("does not flag the hidden sword skills", () => {
    expect(run(SKILL.hiddenSwordLight1).flaggedStepIndexes).toEqual([])
  })

  it("is ended early by Return of Spring, which is flagged only while nothing floats", () => {
    const returned = run(SKILL.returnOfSpring)
    expect(returned.flaggedStepIndexes).toEqual([])
    expect(returned.ticks.length).toBeLessThan(run(SKILL.fanspecial).ticks.length)
    const idle = simulateTimeline({
      ...defaultInputs,
      classId: "silkbindJade",
      activeCustomRotation: testRotation("silkbindJade", {
        steps: [makeStep({ skillId: SKILL.returnOfSpring })],
      }),
    })
    expect(Object.values(idle.invalidStepReasons ?? {}).flat()).toHaveLength(1)
  })

  it("locks the same skills as the Blossoms-gated floating umbrella", () => {
    expect(blossomResource.lockTag).toBe(DRONE_LOCK.tag)
    expect(blossomResource.lockExemptSkillIds).toEqual(DRONE_LOCK.exemptSkillIds)
    expect(blossomResource.recallSkillId).toBe(SKILL.returnOfSpring)
    const fixedCount = DEBUFFS.filter((debuff) => /umbdrone-\d+hit/.test(debuff.id))
    expect(fixedCount).toHaveLength(5)
    for (const debuff of fixedCount) {
      expect(debuff.castLock).toEqual(DRONE_LOCK)
      expect(debuff.recall).toBeUndefined()
    }
    expect(DEBUFFS.find((debuff) => debuff.id === DEBUFF.umbdrone)!.castLock).toBeNull()
  })

  it("exempts the hidden sword skills from the lock", () => {
    expect(DRONE_LOCK.exemptSkillIds).toContain(SKILL.hiddenSwordLight1)
    expect(DRONE_LOCK.exemptSkillIds).toContain(SKILL.hiddenSwordHeavyAlt)
    expect(DRONE_LOCK.exemptSkillIds).not.toContain(SKILL.umblightcharge)
  })
})
