// Scoped to the unvalidated Silkbind Jade class: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "silkbindJade"

type BuildParams = {
  blossomBarrageTier?: number
  gourdTossTier?: number
}

function inputsFor(skillIds: string[], { blossomBarrageTier, gourdTossTier }: BuildParams = {}) {
  return {
    ...defaultInputs,
    classId: CLASS,
    buffParams: {
      ...(blossomBarrageTier ? { blossomBarrage: true, blossomBarrageTier } : {}),
      ...(gourdTossTier ? { gourdToss: true, gourdTossTier } : {}),
    },
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  } satisfies Inputs
}

function illegalStepIndexes(skillIds: string[], build?: BuildParams): number[] {
  const inputs = inputsFor(skillIds, build)
  const result = simulateTimeline(inputs, { collect: "full" })
  return (result.invalidStepIds ?? [])
    .map((stepId) => inputs.activeCustomRotation.steps.findIndex((step) => step.id === stepId))
    .sort((left, right) => left - right)
}

function illegalReason(skillIds: string[], build?: BuildParams): string {
  const result = simulateTimeline(inputsFor(skillIds, build), { collect: "full" })
  return (result.warnings ?? []).filter((warning) => warning.includes("illegal")).join(" | ")
}

describe("Moon Shatter Spring's availability", () => {
  const { fanspecial, fanheavypursuit3Hit, fanheavypursuit5Hit, fanq, fanlightcharged } = SKILL

  it("needs your Lingering Bone on the target", () => {
    expect(illegalStepIndexes([fanspecial, fanheavypursuit3Hit])).toEqual([])
    expect(illegalStepIndexes([fanheavypursuit3Hit])).toEqual([0])
    expect(illegalReason([fanheavypursuit3Hit])).toContain("Lingering Bone")
  })

  it("stays shut for the cooldown it starts", () => {
    expect(illegalStepIndexes([fanspecial, fanheavypursuit3Hit, fanheavypursuit3Hit])).toEqual([2])
    expect(illegalReason([fanspecial, fanheavypursuit3Hit, fanheavypursuit3Hit])).toContain(
      "Moon Shatter Spring Cooldown",
    )
  })

  it("needs Windrider for the five hits, which Emerald Barrier grants where its cast ends", () => {
    expect(illegalStepIndexes([fanspecial, fanheavypursuit5Hit])).toEqual([1])
    expect(illegalReason([fanspecial, fanheavypursuit5Hit])).toContain("Windrider")
    expect(illegalStepIndexes([fanspecial, fanq, fanheavypursuit5Hit])).toEqual([])
  })

  it("is not granted Windrider by a cancelled Emerald Barrier", () => {
    expect(illegalStepIndexes([fanspecial, SKILL.fanqcancel, fanheavypursuit5Hit])).toEqual([2])
  })

  it("loses Windrider after three seconds", () => {
    const longCasts = [fanlightcharged, fanlightcharged]
    expect(illegalStepIndexes([fanspecial, fanq, ...longCasts, fanheavypursuit5Hit])).toEqual([4])
  })

  it("gets Windrider from a Special landing on a target that already carries the mark", () => {
    expect(
      illegalStepIndexes([fanspecial, fanspecial, fanheavypursuit5Hit], { gourdTossTier: 6 }),
    ).toEqual([])
  })

  it("is reset by a Special hit at Gourd Toss rank 6", () => {
    const rank6 = { gourdTossTier: 6 }
    expect(
      illegalStepIndexes([fanspecial, fanheavypursuit3Hit, fanspecial, fanheavypursuit3Hit], rank6),
    ).toEqual([])
    expect(
      illegalStepIndexes([fanspecial, fanheavypursuit3Hit, fanspecial, fanheavypursuit3Hit], {
        gourdTossTier: 3,
      }),
    ).toEqual([3])
  })
})

describe("recharging skills", () => {
  const { fanq, fanqcancel, fanspecial, umbq, fanlightcharged } = SKILL

  it("lets Emerald Barrier cast twice in a row, cancelled or not, and not a third time", () => {
    expect(illegalStepIndexes([fanq, fanq])).toEqual([])
    expect(illegalStepIndexes([fanq, fanqcancel, fanq])).toEqual([2])
    expect(illegalReason([fanq, fanq, fanq])).toContain("Emerald Barrier charges")
  })

  it("lets Spring Sorrow cast as often as its charges allow below Blossom Barrage rank 6", () => {
    expect(illegalStepIndexes([umbq, umbq], { blossomBarrageTier: 4 })).toEqual([])
    expect(illegalStepIndexes([umbq, umbq, umbq], { blossomBarrageTier: 4 })).toEqual([2])
    expect(illegalStepIndexes([umbq, umbq], {})).toEqual([1])
  })

  describe("at Blossom Barrage rank 6", () => {
    const rank6 = { blossomBarrageTier: 6 }
    const CHARGE = 900
    const springSorrowLevels = (skillIds: string[]) => {
      const result = simulateTimeline(inputsFor(skillIds, rank6), { collect: "full" })
      return result.casts!.map((cast) => ({
        startFrame: Math.round(cast.timeSec * 60),
        amount: cast.meterLevels!.find((level) => level.id === "springSorrowCharges")!.amount,
      }))
    }

    it("holds three charges and spends one per cast", () => {
      expect(illegalStepIndexes([umbq, umbq, umbq], rank6)).toEqual([])
      expect(illegalStepIndexes([umbq, umbq, umbq, umbq], rank6)).toEqual([3])
      expect(springSorrowLevels([umbq])[0]!.amount).toBe(3 * CHARGE)
    })

    it("cuts 5 s off the recharge on each hit that finds the previous Combo up", () => {
      const levels = springSorrowLevels([umbq, umbq, umbq])
      const regenerated = (from: number, to: number) =>
        levels[to]!.startFrame - levels[from]!.startFrame
      expect(levels[1]!.amount).toBeCloseTo(levels[0]!.amount - CHARGE + regenerated(0, 1), 6)
      expect(levels[2]!.amount).toBeCloseTo(
        levels[1]!.amount - CHARGE + regenerated(1, 2) + 5 * 60,
        6,
      )
    })

    it("gets no cut from a hit after the previous Combo has lapsed", () => {
      const levels = springSorrowLevels([umbq, ...Array(10).fill(fanlightcharged), umbq, umbq])
      const [afterGap, last] = levels.slice(-2) as [
        (typeof levels)[number],
        (typeof levels)[number],
      ]
      expect(last.amount).toBeCloseTo(
        afterGap.amount - CHARGE + (last.startFrame - afterGap.startFrame),
        6,
      )
    })
  })

  it("gives the Special one 12 s charge, two 15 s charges under Gourd Toss", () => {
    expect(illegalStepIndexes([fanspecial, fanspecial])).toEqual([1])
    expect(illegalStepIndexes([fanspecial, fanspecial], { gourdTossTier: 6 })).toEqual([])
    expect(illegalStepIndexes([fanspecial, fanspecial, fanspecial], { gourdTossTier: 6 })).toEqual([
      2,
    ])
  })
})

describe("charge meters on a cast", () => {
  it("name the game's display unit, one charge, and leave Endurance in raw units", () => {
    const { fanq, umbq, fanspecial } = SKILL
    const result = simulateTimeline(
      inputsFor([fanq, umbq, fanspecial], { blossomBarrageTier: 6 }),
      {
        collect: "full",
      },
    )
    const levels = result.casts![0]!.meterLevels!
    for (const id of [
      "emeraldBarrierCharges",
      "springSorrowCharges",
      "peaksSpringlessSilenceCharges",
    ])
      expect(levels.find((level) => level.id === id)!.unitSize, id).toBe(900)
    expect(levels.find((level) => level.id === "endurance")!.unitSize).toBeUndefined()
  })

  it("shows the charges a failed requirement lacks in charges", () => {
    expect(illegalReason([SKILL.fanq, SKILL.fanq, SKILL.fanq])).toMatch(
      /Emerald Barrier charges ≥ 1 \(has 0\.\d+\)/,
    )
  })
})

describe("the return to the water clone", () => {
  const { fanspecial, fanspecialReturn, fanlightcharged } = SKILL

  it("is castable once, within five seconds of the Special", () => {
    expect(illegalStepIndexes([fanspecialReturn])).toEqual([0])
    expect(illegalStepIndexes([fanspecial, fanspecialReturn])).toEqual([])
    expect(illegalStepIndexes([fanspecial, fanspecialReturn, fanspecialReturn])).toEqual([2])
    expect(
      illegalStepIndexes([
        fanspecial,
        fanlightcharged,
        fanlightcharged,
        fanlightcharged,
        fanspecialReturn,
      ]),
    ).toEqual([4])
  })

  it("cuts the Special's recharge by 3 s at its end under Gourd Toss", () => {
    const result = simulateTimeline(
      inputsFor([fanspecial, fanspecialReturn, fanspecial], { gourdTossTier: 6 }),
      { collect: "full" },
    )
    const levelAt = (index: number) =>
      result.casts![index]!.meterLevels!.find(
        (level) => level.id === "peaksSpringlessSilenceCharges",
      )!.amount
    const afterFirstSpecial = 900
    const regenerated = result.casts![2]!.timeSec * 60
    const cuts = 120 + 180 + 180
    expect(levelAt(2)).toBeCloseTo(afterFirstSpecial + regenerated + cuts, 0)
  })
})
