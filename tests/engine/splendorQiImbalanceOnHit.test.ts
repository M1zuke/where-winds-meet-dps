import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"
const FPS = 60

const withMountainsMight: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 6" },
  { name: "Mountain's Might", stacks: "tier 6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function markerWindowsStartingAt(skillIds: string[]) {
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: withMountainsMight,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  })
  return (result.buffWindows ?? [])
    .filter((window) => window.id === BUFF.qiImbalanceMarker)
    .map((window) => Math.round(window.startSec * FPS))
}

describe("Qi Imbalance is applied by the hit, on the hit's frame", () => {
  it("opens with Qiankun's Lock's hit, not with the cast", () => {
    expect(markerWindowsStartingAt([SKILL.spearq])).toEqual([18])
  })

  it("is never opened by a Qiankun's Lock cast that lands no hit", () => {
    expect(markerWindowsStartingAt([SKILL.spearqPrepull])).toEqual([])
    expect(markerWindowsStartingAt([SKILL.spearq0HitCancel])).toEqual([])
  })

  it("opens with each slash of the Relentless Chase strikes", () => {
    expect(markerWindowsStartingAt([SKILL.swordq2nd])).toEqual([7, 48])
    expect(markerWindowsStartingAt([SKILL.swordq3rd])).toEqual([18, 34, 64])
  })

  it("opens with the flying sword once it has landed", () => {
    const [landing] = markerWindowsStartingAt([SKILL.swordq])
    expect(landing).toBeGreaterThan(18)
  })
})
