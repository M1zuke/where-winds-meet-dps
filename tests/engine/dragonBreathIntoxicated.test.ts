import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkill, testRotation as makeRotation } from "../builtins"
import { SKILL } from "../../src/data/skills/mystic/ids"
import { makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function hitFramesOf(skillIds: string[]): number[] {
  const steps = skillIds.map((skillId) => makeStep({ skillId: builtinSkill(CLASS, skillId).id }))
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, { name: "intoxicated", steps }),
  }
  return simulateTimeline(inputs)
    .timeline!.filter(
      (event) => event.kind === "hit" && /Smolder|Dragon's Breath/.test(event.skillName),
    )
    .map((event) => event.frame)
}

describe("Dragon's Breath without Intoxicated", () => {
  it("lands the first hit on the slow animation's frame when no Drunken Poet cast came before", () => {
    expect(hitFramesOf([SKILL.dragonFireSmolder1Hit])[0]).toBe(77)
  })

  it("lands on the quick animation's frame after the Drunken Poet cast", () => {
    expect(hitFramesOf([SKILL.drunkenpoetPrepull, SKILL.dragonFireSmolder1Hit])[0]).toBe(36)
  })

  it("opens Intoxicated itself, so the next cast is quick", () => {
    const [first, second] = hitFramesOf([SKILL.dragonFireSmolder1Hit, SKILL.dragonFireSmolder1Hit])
    expect(second! - first!).toBeGreaterThanOrEqual(40)
    expect(second! - first!).toBeLessThanOrEqual(41)
  })

  it("runs the full form's slow cast to frame 150 instead of 137", () => {
    const quick = hitFramesOf([
      SKILL.drunkenpoetPrepull,
      SKILL.dragonFireSmolder2Hits,
      SKILL.dragonFireSmolder1Hit,
    ])
    const slow = hitFramesOf([SKILL.dragonFireSmolder2Hits, SKILL.dragonFireSmolder1Hit])
    expect(slow[3]! - quick[3]!).toBeGreaterThanOrEqual(12)
    expect(slow[3]! - quick[3]!).toBeLessThanOrEqual(14)
  })
})
