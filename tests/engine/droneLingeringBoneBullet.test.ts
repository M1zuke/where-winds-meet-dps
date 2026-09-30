// In-game values as of 2026-09-30 — see droneTick.ts for why only the
// Blossoms-gated drone gets the extra bullet.
import { describe, expect, it } from "vitest"
import { planDotTicks } from "../../src/engine/dot"
import { umbdrone, umbdrone20Hit } from "../../src/data/skills/silkbind-jade/debuffs"
import type { Debuff } from "../../src/engine/debuff"

const SAME_LENGTH_WINDOW = [{ start: 0, end: umbdrone20Hit.durationFrames }]

function planWithMarkAlwaysUp(debuff: Debuff) {
  return planDotTicks({
    debuff,
    dot: debuff.dot!,
    windows: SAME_LENGTH_WINDOW,
    stacksAt: () => 1,
    inWindow: () => true,
    weightAt: () => 1,
  })
}

describe("drone tick count with Lingering Bone active for the whole window", () => {
  it("a fixed hit-count drone lands exactly its named tick count, gaining no extra bullet", () => {
    expect(planWithMarkAlwaysUp(umbdrone20Hit)).toHaveLength(20)
  })

  it("the Blossoms-gated default drone still fires its extra bullet in the same window", () => {
    const fixedTicks = planWithMarkAlwaysUp(umbdrone20Hit).length
    const gatedPlan = planWithMarkAlwaysUp(umbdrone)
    const extraBulletTicks = gatedPlan.filter((tick) => tick.requiresBuff).length
    expect(extraBulletTicks).toBeGreaterThan(0)
    expect(gatedPlan.length).toBeGreaterThan(fixedTicks)
  })
})
