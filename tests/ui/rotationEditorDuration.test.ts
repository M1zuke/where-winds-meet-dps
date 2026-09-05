import { describe, expect, it } from "vitest"
import { rotationDurationSec } from "../../src/ui/features/rotation/rotation-editor-panel/rotationDuration"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { RotationCast } from "../../src/engine/types"

const CLASS = "testClass"
const short = makeSkill(CLASS, { id: "short", castFrames: 30, hits: [makeHit({ frame: 0 })] })
const prepull = makeSkill(CLASS, {
  id: "prepull",
  name: "Prepull",
  prePull: true,
  castFrames: 0,
  hits: [makeHit({ frame: 0 })],
})
const skillsById = new Map([
  [short.id, short],
  [prepull.id, prepull],
])
const rotation = makeRotation(CLASS, {
  steps: [
    makeStep({ id: "s0", skillId: prepull.id, hitCount: 1 }),
    makeStep({ id: "s1", skillId: short.id, hitCount: 1 }),
    makeStep({ id: "s2", skillId: short.id, hitCount: 1 }),
  ],
})

function cast(stepId: string, stepIndex: number): RotationCast {
  return { index: stepIndex + 1, stepId, stepIndex, skillName: "", timeSec: 0, inWindow: true, prePull: false, buffs: [] }
}

describe("the editor's computed duration", () => {
  it("takes the simulated duration when the result laid out exactly the shown rotation", () => {
    const simulated = { rotationDuration: 1.7, casts: [cast("s0", 0), cast("s1", 1), cast("s2", 2)] }
    expect(rotationDurationSec(rotation, skillsById, simulated)).toBe(1.7)
  })

  it("falls back to the modules' cast frames, pre-pull steps excluded, when the result belongs to another rotation", () => {
    const simulated = { rotationDuration: 9, casts: [cast("other-0", 0), cast("other-1", 1), cast("other-2", 2)] }
    expect(rotationDurationSec(rotation, skillsById, simulated)).toBe(1)
    expect(rotationDurationSec(rotation, skillsById, { rotationDuration: 9, casts: [] })).toBe(1)
  })
})
