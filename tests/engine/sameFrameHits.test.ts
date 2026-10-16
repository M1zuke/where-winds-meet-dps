// Damaging hits on one frame resolve one after another, each reading what the
// ones before it granted (docs/TIMELINE.md § "Triggers"). Scoped to Stonesplit
// Strength, whose Throat-Pierced stacks on every hit that lists it.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"

const CLASS = "stonesplitStrength"

function totalDamageOfHitsAt(frames: number[], stacks = true): number {
  const cast = makeSkill(CLASS, {
    name: "Stacking",
    castFrames: 60,
    triggersBuffs: stacks ? [BUFF.throatPierced] : [],
    hits: frames.map((frame) => makeHit({ frame, physMultiplier: 2, physFixed: 100 })),
  })
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [cast],
    customBuffs: [],
    mindMethods: [
      { id: INNER_WAY_ID.throatPierce, name: "Throat-Pierce", stacks: "tier 6" },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
    ],
    activeCustomRotation: testRotation(CLASS, { steps: [makeStep({ skillId: cast.id })] }),
  }).totalDamage
}

describe("hits on one frame", () => {
  it("see the stacks the hits before them granted, as hits one frame apart do", () => {
    expect(totalDamageOfHitsAt([0, 0, 0])).toBeCloseTo(totalDamageOfHitsAt([0, 1, 2]), 6)
  })

  it("never see the stack their own hit grants", () => {
    expect(totalDamageOfHitsAt([0])).toBeCloseTo(totalDamageOfHitsAt([0], false), 6)
  })

  it("are lifted by the stacks the earlier ones granted", () => {
    expect(totalDamageOfHitsAt([0, 0, 0])).toBeGreaterThan(totalDamageOfHitsAt([0, 0, 0], false))
  })
})
