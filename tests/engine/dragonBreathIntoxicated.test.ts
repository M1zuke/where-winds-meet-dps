import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkill, testRotation as makeRotation } from "../builtins"
import { SKILL } from "../../src/data/skills/mystic/ids"
import { makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const DEFLECT_CANCEL = "bellstrikeUmbra-deflect-cancel"
const SOBER_SORROW = "bellstrikeUmbra-spearq"
const FPS = 60

function run(skillIds: string[]) {
  const steps = skillIds.map((skillId) => makeStep({ skillId: builtinSkill(CLASS, skillId).id }))
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, { name: "intoxicated", steps }),
  }
  return simulateTimeline(inputs)
}

function breathHitFrames(skillIds: string[]): number[] {
  return run(skillIds)
    .timeline!.filter(
      (event) =>
        event.kind === "hit" && event.damage > 0 && /Smolder|Dragon's Breath/.test(event.skillName),
    )
    .map((event) => event.frame)
}

function castStartFrames(skillIds: string[]): number[] {
  return run(skillIds).casts!.map((cast) => Math.round(cast.timeSec * FPS))
}

function castLengthOf(skillIds: string[]): number {
  const [first, second] = castStartFrames(skillIds)
  return second! - first!
}

function expectWithinOneFrame(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)
}

const POET = SKILL.drunkenpoetPrepull
const SMOLDER_1 = SKILL.dragonFireSmolder1Hit
const SMOLDER_2 = SKILL.dragonFireSmolder2Hits
const BREATH_1 = SKILL.fireBreath1Hit

describe("Dragon's Breath without Intoxicated at the press", () => {
  it("lands the first hit on the slow animation's frame when no Drunken Poet cast came before", () => {
    expect(breathHitFrames([SMOLDER_1])[0]).toBe(77)
  })

  it("lands on the quick animation's frame after the Drunken Poet cast", () => {
    expect(breathHitFrames([POET, SMOLDER_1])[0]).toBe(36)
  })

  it("lands both hits and the bonus on the slow frames, one choice for the whole cast", () => {
    expect(breathHitFrames([SMOLDER_2])).toEqual([77, 164, 170])
    expect(breathHitFrames([POET, SMOLDER_2])).toEqual([36, 102, 108])
  })

  it("runs the full slow cast to one frame past its second hit", () => {
    expectWithinOneFrame(castLengthOf([SMOLDER_2, SMOLDER_1]), 164.66)
  })

  it("lets the bonus land after the next cast has begun", () => {
    const frames = breathHitFrames([SMOLDER_2, SMOLDER_1])
    const nextCastStart = castStartFrames([SMOLDER_2, SMOLDER_1])[1]!
    expect(frames.slice(0, 3)).toEqual([77, 164, 170])
    expect(frames[1]!).toBeLessThanOrEqual(nextCastStart)
    expect(frames[2]!).toBeGreaterThan(nextCastStart)
    expect(frames[3]! - nextCastStart).toBe(36)
  })

  it("opens Intoxicated 12 frames in, so the next cast is quick even when the slow cast is cut", () => {
    const steps = [SMOLDER_1, DEFLECT_CANCEL, SMOLDER_1]
    const frames = breathHitFrames(steps)
    const thirdStart = castStartFrames(steps)[2]!
    expect(frames[0]).toBe(77)
    expect(frames[1]! - thirdStart).toBe(36)
  })

  it("never opens Intoxicated from the quick form, so a quick cast does not renew the window", () => {
    const steps = [POET, ...Array<string>(16).fill(SMOLDER_2)]
    const frames = breathHitFrames(steps)
    const starts = castStartFrames(steps)
    const firstHitOffsets = starts.slice(1).map((start, index) => frames[index * 3]! - start)
    expect(firstHitOffsets.slice(0, 12).every((offset) => offset === 36)).toBe(true)
    expect(firstHitOffsets.some((offset) => offset > 70)).toBe(true)
  })
})

describe("a follow-up of higher priority breaks Dragon's Breath from its first frame", () => {
  it("cuts the quick single-hit form one frame after its hit and drops the later hits", () => {
    const steps = [POET, SMOLDER_1, DEFLECT_CANCEL]
    const starts = castStartFrames(steps)
    expectWithinOneFrame(starts[2]! - starts[1]!, 37.39)
    expect(breathHitFrames(steps)).toEqual([36])
  })

  it("cuts the slow single-hit form at 77.38 frames", () => {
    const steps = [SMOLDER_1, DEFLECT_CANCEL]
    const starts = castStartFrames(steps)
    expectWithinOneFrame(starts[1]! - starts[0]!, 77.38)
    expect(breathHitFrames(steps)).toEqual([77])
  })
})

describe("a follow-up of ordinary priority waits for the animation's own end", () => {
  it("lets the quick single-hit form land both hits and the bonus before Sober Sorrow", () => {
    const steps = [POET, BREATH_1, SOBER_SORROW]
    const starts = castStartFrames(steps)
    expectWithinOneFrame(starts[2]! - starts[1]!, 136.8)
    expect(breathHitFrames(steps)).toEqual([36, 102, 108])
  })

  it("holds the slow single-hit form to 150 frames and lands only its first hit", () => {
    const steps = [BREATH_1, SOBER_SORROW]
    const starts = castStartFrames(steps)
    expectWithinOneFrame(starts[1]! - starts[0]!, 150)
    expect(breathHitFrames(steps)).toEqual([77])
  })
})
