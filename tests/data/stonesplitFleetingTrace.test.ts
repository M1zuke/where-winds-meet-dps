import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { SKILL, STATUS } from "../../src/data/skills/stonesplit-strength/ids"

const fleetingTrace = builtinSkillsForClass("stonesplitStrength").find(
  (skill) => skill.id === SKILL.snowpartingspecial,
)!

describe("Fleeting Trace", () => {
  it("casts 124 frames, as long as its animation lasts", () => {
    expect(fleetingTrace.castFrames).toBe(124)
  })

  it("applies Dread on its second last and its last hit only", () => {
    const applied = fleetingTrace.hits.map((hit) =>
      hit.triggers.some((trigger) => trigger.targetId === STATUS.dread),
    )
    expect(applied).toEqual([false, false, false, false, false, false, false, true, true])
    expect(fleetingTrace.hits[7]!.frame).toBe(117)
    expect(fleetingTrace.hits[8]!.frame).toBe(121)
  })
})
