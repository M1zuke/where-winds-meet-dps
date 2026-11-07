// Scoped to Bellstrike Splendor — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { legionCrusher } from "../../src/data/skills/bellstrike-splendor/legioncrusher"
import { stormDanceStage1Wushuang } from "../../src/data/skills/bellstrike-splendor/stormdance-stage-1-wushuang"
import { stormDanceStage2Wushuang } from "../../src/data/skills/bellstrike-splendor/stormdance-stage-2-wushuang"
import { stormDanceStage1 } from "../../src/data/skills/bellstrike-splendor/stormdance-stage-1"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"

function rotationInputs(skillIds: string[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  }
}

describe("Wushuang Stance — Legion Crusher speeds up the next Storm Dance", () => {
  it("stage 1 lands only its first 4 spin colliders, at the earlier frames", () => {
    expect(stormDanceStage1Wushuang.hits.slice(0, 4).map((hit) => hit.frame)).toEqual([
      20, 35, 47, 59,
    ])
    expect(stormDanceStage1Wushuang.castFrames).toBe(127)
  })

  it("stage 1's finisher frames follow the earlier release, not the normal-form ones", () => {
    const [, , , , finisher1, finisher2] = stormDanceStage1Wushuang.hits
    expect(finisher1!.frame).toBe(72)
    expect(finisher2!.frame).toBe(103)
  })

  it("a Legion Crusher hit right before Storm Dance leaves the Wushuang form's cast conditions unflagged", () => {
    const result = simulateTimeline(rotationInputs([legionCrusher.id, stormDanceStage1Wushuang.id]))
    expect(result.invalidStepIds ?? []).toHaveLength(0)
  })

  it("without a preceding Legion Crusher hit, the Wushuang form's cast conditions are flagged", () => {
    const result = simulateTimeline(rotationInputs([stormDanceStage1Wushuang.id]))
    expect(result.invalidStepIds ?? []).not.toHaveLength(0)
  })

  it("stage 2's Wushuang form carries a shorter cast and no stage-1 finisher hits", () => {
    const finisherPhysMultipliers = [0.20033, 0.40066]
    for (const hit of stormDanceStage2Wushuang.hits) {
      expect(finisherPhysMultipliers).not.toContain(hit.physMultiplier)
    }
    expect(stormDanceStage2Wushuang.castFrames).toBeLessThan(stormDanceStage1.castFrames * 2)
  })
})
