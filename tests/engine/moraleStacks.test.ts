import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { MoraleStacks } from "../../src/engine/buffs/morale"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

describe("Morale Chant stacks", () => {
  it("adds a stack on a direct hit at most once per 2 s", () => {
    const stacks = new MoraleStacks()
    stacks.gainFromDirectHit(0)
    stacks.gainFromDirectHit(1.9)
    expect(stacks.stacksAt(1.95)).toBe(1)
    stacks.gainFromDirectHit(2)
    expect(stacks.stacksAt(2)).toBe(2)
  })

  it("starts at no stacks before the first direct hit", () => {
    expect(new MoraleStacks().stacksAt(0)).toBe(0)
  })

  it("drops every stack 12 s after the last gain", () => {
    const stacks = new MoraleStacks()
    for (const hitSec of [0, 2, 4]) stacks.gainFromDirectHit(hitSec)
    expect(stacks.stacksAt(15.9)).toBe(3)
    expect(stacks.stacksAt(16)).toBe(0)
    stacks.gainFromDirectHit(20)
    expect(stacks.stacksAt(20)).toBe(1)
  })
})

describe("Yi River", () => {
  const CLASS = "bellstrikeUmbra"
  const FPS = 60

  function yiRiverFrames(hitSeconds: number[]): number[] {
    const skill = makeSkill(CLASS, {
      name: "Test Weapon Hit",
      skillType: "weapon",
      castFrames: Math.round((hitSeconds[hitSeconds.length - 1]! + 1) * FPS),
      hits: hitSeconds.map((tSec) =>
        makeHit({ frame: Math.round(tSec * FPS), physMultiplier: 1, physFixed: 0 }),
      ),
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      mindMethods: [
        { name: "Morale Chant", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
      customSkills: [skill],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: skill.id })],
      }),
    }
    return simulateTimeline(inputs)
      .timeline!.filter((event) => event.skillName === "Yi River")
      .map((event) => event.frame)
  }

  it("fires on the hit that completes the stacks and 0.05 s after it", () => {
    expect(yiRiverFrames([0, 2, 4, 6, 8, 8.5])).toEqual([Math.round(8.05 * FPS)])
  })

  it("does not fire again inside its 10 s", () => {
    expect(yiRiverFrames([0, 2, 4, 6, 8, 10, 12, 14, 16])).toEqual([Math.round(8.05 * FPS)])
  })

  it("fires again on the first direct hit after its 10 s", () => {
    expect(yiRiverFrames([0, 2, 4, 6, 8, 12, 16, 18.5, 19])).toEqual([
      Math.round(8.05 * FPS),
      Math.round(18.55 * FPS),
    ])
  })

  it("stops once the stacks lapse", () => {
    expect(yiRiverFrames([0, 2, 4, 6, 8, 40])).toEqual([Math.round(8.05 * FPS)])
  })
})
