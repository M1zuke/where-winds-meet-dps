// Scoped to Silkbind Jade's umbrella throw.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { LAUNCH_HIGHER_PRIORITY_BREAK_FRAME } from "../../src/data/skills/silkbind-jade/droneLaunchBreak"
import { testRotation } from "../builtins"

function launchToFollowUpFrames(followUpId: string): number {
  const rotation = testRotation("silkbindJade", {
    steps: [SKILL.umbdronelaunch20Hit, followUpId].map((skillId) => makeStep({ skillId })),
  })
  const result = simulateTimeline({
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
  })
  const casts = (result.casts ?? []).filter((cast) => !cast.skillName.startsWith("Weapon Swap"))
  return Math.round((casts[1].timeSec - casts[0].timeSec) * 60)
}

describe("the umbrella throw's hand-over to a follow-up", () => {
  it("lets a follow-up of higher priority break it when the umbrella attaches", () => {
    expect(launchToFollowUpFrames(SKILL.fanspecial)).toBeLessThanOrEqual(
      LAUNCH_HIGHER_PRIORITY_BREAK_FRAME + 1,
    )
  })

  it("makes a follow-up of priority 2 or lower wait for the recovery", () => {
    expect(launchToFollowUpFrames(SKILL.fanlightcharged)).toBeGreaterThanOrEqual(66)
  })
})
