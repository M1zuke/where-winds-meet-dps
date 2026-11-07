// Scoped to Silkbind Jade's fixed-count floating umbrella.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import { DEBUFF, SKILL } from "../../src/data/skills/silkbind-jade/ids"
import {
  DRONE_BULLET_PROJECTILE,
  DRONE_RECALL,
} from "../../src/data/skills/silkbind-jade/droneTick"
import { projectileTravelFrames } from "../../src/engine/skill"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { testRotation } from "../builtins"

const DRONE_ROW = "UmbDrone[20hit] (DoT)"
const FAN_CASTS = 5

function droneTicks(finalSkillId: string) {
  const rotation = testRotation("silkbindJade", {
    steps: [
      SKILL.umbdronelaunch20Hit,
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
  const rotationCasts = (result.casts ?? []).filter(
    (cast) => !cast.skillName.startsWith("Weapon Swap"),
  )
  const recallCast = rotationCasts[FAN_CASTS + 1]
  const flightSec = projectileTravelFrames(DRONE_BULLET_PROJECTILE, recallCast.distanceMeters) / 60
  return { ticks, recallSec: recallCast.timeSec, flightSec }
}

describe("the fixed-count floating umbrella", () => {
  it("keeps ticking while only fan skills follow the launch", () => {
    const { ticks, recallSec } = droneTicks(SKILL.fanspecial)
    expect(ticks.some((tick) => tick.timeSec > recallSec)).toBe(true)
  })

  it("is recalled when an umbrella skill starts, so only bullets already in flight land after that", () => {
    const { ticks, recallSec, flightSec } = droneTicks(SKILL.umblightcharge)
    expect(ticks.length).toBeGreaterThan(0)
    for (const tick of ticks) expect(tick.timeSec).toBeLessThan(recallSec + flightSec)
    const ordinary = droneTicks(SKILL.fanspecial).ticks
    expect(ticks.length).toBeLessThan(ordinary.length)
  })

  it("is recalled by the same skills as the Blossoms-gated floating umbrella", () => {
    expect(blossomResource.recallTag).toBe(DRONE_RECALL.tag)
    expect(blossomResource.recallExemptSkillIds).toEqual(DRONE_RECALL.exemptSkillIds)
    const fixedCount = DEBUFFS.filter((debuff) => /umbdrone-\d+hit/.test(debuff.id))
    expect(fixedCount).toHaveLength(5)
    for (const debuff of fixedCount) expect(debuff.recall).toEqual(DRONE_RECALL)
    expect(DEBUFFS.find((debuff) => debuff.id === DEBUFF.umbdrone)!.recall).toBeNull()
  })

  it("exempts the hidden sword skills from the recall", () => {
    expect(DRONE_RECALL.exemptSkillIds).toContain(SKILL.hiddenSwordLight1)
    expect(DRONE_RECALL.exemptSkillIds).toContain(SKILL.hiddenSwordHeavyAlt)
    expect(DRONE_RECALL.exemptSkillIds).not.toContain(SKILL.umblightcharge)
  })
})
