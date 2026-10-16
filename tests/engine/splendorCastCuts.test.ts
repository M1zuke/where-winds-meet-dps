import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { testRotation } from "../builtins"

const CLASS = "bellstrikeSplendor"
const FPS = 60
const DEFLECT_CANCEL = "bellstrikeSplendor-deflect-cancel"

function framesToNextCast(firstSkillId: string, nextSkillId: string): number {
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: firstSkillId }), makeStep({ skillId: nextSkillId })],
    }),
  })
  const [first, next] = result.casts!.filter((cast) => !cast.skillName.startsWith("Weapon Swap"))
  return Math.round((next!.timeSec - first!.timeSec) * FPS)
}

describe.each([
  [SKILL.swordq, 55, 19],
  [SKILL.swordq2nd, 60, 50],
  [SKILL.swordq3rd, 84, 66],
])("%s", (skillId, fullFrames, cutFrames) => {
  it("runs to its post-move frame before a skill that cannot cut it", () => {
    expect(framesToNextCast(skillId, SKILL.swordHeavyCharged)).toBe(fullFrames)
  })

  it("is cut by Energy Surge one frame after its last kept hit", () => {
    expect(framesToNextCast(skillId, SKILL.energySurge)).toBe(cutFrames)
  })

  it("is cut by a Deflect Cancel the same way", () => {
    expect(framesToNextCast(skillId, DEFLECT_CANCEL)).toBe(cutFrames)
  })
})

describe("Relentless Chase's second strike", () => {
  it("is offered from the frame after the first strike starts, for six seconds", () => {
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS,
      activeCustomRotation: testRotation(CLASS, {
        steps: [makeStep({ skillId: SKILL.swordq2nd })],
      }),
    })
    const secondStrikeWindow = result.buffWindows!.find(
      (candidate) => candidate.id === BUFF.relentlessChaseWindow,
    )!
    expect([
      Math.round(secondStrikeWindow.startSec * FPS),
      Math.round(secondStrikeWindow.endSec * FPS),
    ]).toEqual([1, 361])
  })
})
