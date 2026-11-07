// Scoped to Silkbind Jade's Spring Away and Combo - Extend Mark; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { WindowExtensionEnsemble } from "../../src/engine/buffs/windowExtension"
import { umblightcharge } from "../../src/data/skills/silkbind-jade/umblightcharge"
import { umblightcharge12 } from "../../src/data/skills/silkbind-jade/umblightcharge-12"
import { DEFAULT_PREFERRED_DISTANCE_METERS, distanceAtCastStart } from "../../src/engine/distance"
import { classDefinition } from "../../src/definitions/classes/registry"
import { resolvedHitFrame, type Skill } from "../../src/engine/skill"
import { quantiseToRenderFrame } from "../../src/engine/timeline"

const NOMINAL_FPS = 60
const COMBO = "combo"
const COOLDOWN_SEC = 0.5

function bulletsThatExtend(skill: Skill, averageFps: number): number[] {
  const meleeReach = classDefinition("silkbindJade")!.defaultMeleeReachMeters
  const distance = distanceAtCastStart(
    skill,
    meleeReach,
    DEFAULT_PREFERRED_DISTANCE_METERS,
    DEFAULT_PREFERRED_DISTANCE_METERS,
  )
  const ensemble = new WindowExtensionEnsemble({
    buffIds: [COMBO],
    bySec: 1,
    maxRemainingSec: 1000,
  })
  const window = { start: 0, expiresAt: 100 }
  let remaining = ensemble.expectedRemainingSec(COMBO, 0, () => window)
  const extending: number[] = []
  skill.hits.forEach((bullet, index) => {
    const landing = quantiseToRenderFrame(
      resolvedHitFrame(bullet, () => false, distance),
      NOMINAL_FPS / averageFps,
    )
    ensemble.trigger(
      {
        timeSec: Math.round(landing) / NOMINAL_FPS,
        stampSec: landing / NOMINAL_FPS,
        runKey: null,
        latenessMaxSec: 0,
        conditionsHold: true,
        cooldownSec: COOLDOWN_SEC,
        requiredWindowId: null,
      },
      () => window,
    )
    const next = ensemble.expectedRemainingSec(COMBO, 0, () => window)
    if (next > remaining) extending.push(index + 1)
    remaining = next
  })
  return extending
}

describe("Spring Away extends Combo on the bullets the render frame grid lets through", () => {
  it.each([250, 240, 144, 120, 100, 90, 60])(
    "lands bullets k and k + 3 exactly 0.5 s apart at %i fps, so every fourth bullet extends",
    (averageFps) => {
      expect(bulletsThatExtend(umblightcharge, averageFps)).toEqual([1, 4])
      expect(bulletsThatExtend(umblightcharge12, averageFps)).toEqual([1, 4, 7, 10])
    },
  )

  it.each([
    [165, [1, 4], [1, 4, 8, 12]],
    [143, [1, 4], [1, 4, 8, 11]],
    [59, [1, 4], [1, 4, 8, 12]],
  ])(
    "shifts a bullet whose 0.5 s gap lands a render frame short at %i fps",
    (averageFps, sixBullets, twelveBullets) => {
      expect(bulletsThatExtend(umblightcharge, averageFps)).toEqual(sixBullets)
      expect(bulletsThatExtend(umblightcharge12, averageFps)).toEqual(twelveBullets)
    },
  )
})
