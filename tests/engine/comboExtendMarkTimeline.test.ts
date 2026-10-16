// Scoped to the unvalidated Jade presets: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Inputs } from "../../src/engine/types"

function jadeInputs(rotationName: string): Inputs {
  const rotation = builtinRotationsForClass("silkbindJade").find(
    (candidate) => candidate.name === rotationName,
  )!
  return {
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
    buffParams: { blossomBarrage: true, blossomBarrageTier: 6 },
  }
}

function totalWithoutExtension(inputs: Inputs): number {
  const mark = blossomBarrage.buffDefs!.find((module) => module.id === BUFF.comboExtendMark)!
  const extension = mark.extendsBuffs
  Object.assign(mark, { extendsBuffs: undefined })
  try {
    return simulateTimeline(inputs).totalDamage
  } finally {
    Object.assign(mark, { extendsBuffs: extension })
  }
}

describe("Combo - Extend Mark in a full simulation", () => {
  it("adds damage when the Combo would otherwise lapse inside the Exhausted window", () => {
    const inputs = jadeInputs("T5")
    expect(simulateTimeline(inputs).totalDamage).toBeGreaterThan(totalWithoutExtension(inputs))
  })

  it("changes nothing when the Combo is renewed before it can lapse", () => {
    const inputs = jadeInputs("2.0 DH")
    expect(simulateTimeline(inputs).totalDamage).toBe(totalWithoutExtension(inputs))
  })

  it("realises one trajectory for a seeded run", () => {
    const inputs = jadeInputs("T5")
    const first = simulateTimeline(inputs, { seed: 7 })
    expect(simulateTimeline(inputs, { seed: 7 }).totalDamage).toBe(first.totalDamage)
  })
})
