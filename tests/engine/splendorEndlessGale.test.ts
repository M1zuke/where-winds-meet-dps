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
const FIVE_SECONDS = 300
const SPEAR_Q_CAST_FRAMES = 42

const innerWays = (mountainsMight: boolean): Inputs["mindMethods"] => [
  { name: "Sword Morph", stacks: "tier 6" },
  { name: mountainsMight ? "Mountain's Might" : "", stacks: mountainsMight ? "tier 6" : "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function windows(skillIds: string[], mountainsMight: boolean) {
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: innerWays(mountainsMight),
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
    set: null,
  })
  const framesOf = (id: string) =>
    (result.buffWindows ?? [])
      .filter((window) => window.id === id)
      .map((window) => [Math.round(window.startSec * FPS), Math.round(window.endSec * FPS)])
  return {
    plain: framesOf(BUFF.endlessGaleAtStart),
    talent: framesOf(BUFF.endlessGale),
    mountainsMight: framesOf(BUFF.endlessGaleCostReductionEnd),
  }
}

describe("the plain Endless Gale", () => {
  it("runs five seconds from Qiankun's Lock's end, restarted from its start", () => {
    expect(windows([SKILL.spearq], false).plain).toEqual([[0, SPEAR_Q_CAST_FRAMES + FIVE_SECONDS]])
  })

  it("is dispelled by Mountain's Might's variant at Qiankun's Lock's end", () => {
    const withMountainsMight = windows([SKILL.spearq], true)
    expect(withMountainsMight.plain).toEqual([[0, SPEAR_Q_CAST_FRAMES]])
    expect(withMountainsMight.mountainsMight).toEqual([
      [SPEAR_Q_CAST_FRAMES, SPEAR_Q_CAST_FRAMES + 2 * FIVE_SECONDS],
    ])
  })

  it("never overlaps Mountain's Might's variant, so their Endurance cost cuts never stack", () => {
    const { plain, mountainsMight } = windows([SKILL.spearq], true)
    expect(plain.at(-1)![1]).toBeLessThanOrEqual(mountainsMight[0]![0])
  })

  it("is not re-added by Legion Crusher while Mountain's Might's variant holds", () => {
    const withLegionCrusher = windows([SKILL.spearq, SKILL.legionCrusher], true)
    expect(withLegionCrusher.plain).toEqual([[0, SPEAR_Q_CAST_FRAMES]])
  })

  it("is re-added by Legion Crusher without Mountain's Might", () => {
    const withLegionCrusher = windows([SKILL.spearq, SKILL.legionCrusher], false)
    expect(withLegionCrusher.plain).toContainEqual([
      SPEAR_Q_CAST_FRAMES,
      SPEAR_Q_CAST_FRAMES + FIVE_SECONDS,
    ])
  })
})

describe("Mountain's Might's Endless Gale is ten seconds from the latest Qiankun's Lock end", () => {
  it("is not pushed past ten seconds by a Qiankun's Lock cast still inside the earlier window", () => {
    const { talent } = windows([SKILL.spearq, SKILL.spearq], true)
    const lastEnd = Math.max(...talent.map(([, end]) => end!))
    const secondCastEnd = SPEAR_Q_CAST_FRAMES * 2
    expect(lastEnd).toBeLessThanOrEqual(secondCastEnd + 2 * FIVE_SECONDS)
  })
})
