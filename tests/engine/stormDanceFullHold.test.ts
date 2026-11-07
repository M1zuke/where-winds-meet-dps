// Scoped to Bellstrike Splendor — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { stormDanceStage2 } from "../../src/data/skills/bellstrike-splendor/stormdance-stage-2"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"

function inputsFor(): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: stormDanceStage2.id })],
    }),
  }
}

describe("Storm Dance stage 2 — a full hold never carries stage 1's own finisher", () => {
  it("sub-casts exactly the 8 stage-1 spin hits, never the 2 stage-1 finisher hits", () => {
    const finisherPhysMultipliers = [0.20033, 0.40066]
    for (const hit of stormDanceStage2.hits) {
      expect(finisherPhysMultipliers).not.toContain(hit.physMultiplier)
    }
  })

  it("a full-hold cast lands 8 + 33 spin hits plus the stage-2 finisher only", () => {
    const result = simulateTimeline(inputsFor(), { collect: "full" })
    const damagingStormDanceHits = (result.timeline ?? []).filter(
      (event) =>
        event.kind === "hit" && event.skillName.startsWith("Storm Dance") && event.damage > 0,
    )
    expect(damagingStormDanceHits).toHaveLength(8 + 33 + 2)
  })

  it("sub-casts only the 8 spin hits, never re-entering the whole stage-1 skill", () => {
    const subCastTargets = stormDanceStage2.hits.flatMap((skillHit) =>
      skillHit.triggers
        .filter((trigger) => trigger.kind === "castSkill")
        .map((trigger) => trigger.targetId),
    )
    expect(subCastTargets).toEqual([SKILL.stormDanceStage1Spin])
  })

  it("the meter drain applies exactly once for the whole cast", () => {
    // 20 / s continuously from 38 f to the 4.5 s stop — one drain window, not
    // two (docs/TIMELINE.md § "Meters"); the sub-cast target above carries no
    // `meterDrains` of its own for this to double up against.
    expect(stormDanceStage2.meterDrains).toHaveLength(1)
    expect(stormDanceStage2.meterDrains![0]!.stopAfterSec).toBe(4.5)
  })
})
