// Scoped to Bamboocut Draught's four slottable inner ways — the class
// carries no validated anchor (docs/TESTING.md § "Class scoping"), so
// nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

function mindMethodsWith(innerWayId: string, tier: number): Inputs["mindMethods"] {
  return [
    { id: innerWayId, name: innerWayId, stacks: String(tier) },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
}

const UNSLOTTED: Inputs["mindMethods"] = [
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function runPeakfall(mindMethods: Inputs["mindMethods"], bingePoints = 100) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.peakfall, hitCount: 2 })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
}

function peakfallDamage(result: ReturnType<typeof runPeakfall>): number {
  return result.perSkill.find((row) => row.breakdownName === "Peakfall")!.expectedDamage
}

describe("Eonpour", () => {
  it("pays ×1.2 at tier 3 and ×1.1 at tier 2", () => {
    const atTier3 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.eonpour, 3)))
    const atTier2 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.eonpour, 2)))
    expect(atTier3 / atTier2).toBeCloseTo(1.2 / 1.1, 5)
  })
})

describe("Skyspeak", () => {
  // Hero's Blood marks and releases; Peakfall in between is the
  // Inebriate-enhanced hit that feeds the echo while the mark is up.
  function runHerosBloodMarkFeedRelease(tier: number) {
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      mindMethods: mindMethodsWith(INNER_WAY_ID.skyspeak, tier),
      activeCustomRotation: makeRotation(CLASS, {
        steps: [
          makeStep({ skillId: SKILL.herosBlood, hitCount: 2 }),
          makeStep({ skillId: SKILL.peakfall, hitCount: 2 }),
          makeStep({ skillId: SKILL.herosBlood, hitCount: 2 }),
        ],
        openingStacks: { [STATUS.bingePoints]: 100 },
      }),
    })
  }

  it("below tier 6 banks no Drunkslay echo", () => {
    const belowTier = runHerosBloodMarkFeedRelease(5)
    const atTier = runHerosBloodMarkFeedRelease(6)
    expect(belowTier.timeline!.some((event) => event.skillName === "Drunkslay State")).toBe(false)
    expect(atTier.timeline!.some((event) => event.skillName === "Drunkslay State")).toBe(true)
  })
})

describe("Mistwing", () => {
  it("tier 5 adds no Inebriate penetration, tier 6 does", () => {
    // Other always-on Inebriate bonuses (unrelated to Mistwing) already
    // separate Tipsy from not-Tipsy damage at every tier, so the Mistwing-
    // specific contribution is the MARGIN Tipsy adds, not the raw damage.
    const tier5 = mindMethodsWith(INNER_WAY_ID.mistwing, 5)
    const tier6 = mindMethodsWith(INNER_WAY_ID.mistwing, 6)
    const tier5Margin = peakfallDamage(runPeakfall(tier5, 100)) - peakfallDamage(runPeakfall(tier5, 0))
    const tier6Margin = peakfallDamage(runPeakfall(tier6, 100)) - peakfallDamage(runPeakfall(tier6, 0))
    expect(tier6Margin).toBeGreaterThan(tier5Margin)
  })
})

describe("Volutefit", () => {
  it("tier 1 raises an Inebriate-enhanced skill by 5%", () => {
    function runHerosBlood(mindMethods: Inputs["mindMethods"]) {
      return runEngine({
        ...defaultInputs,
        classId: CLASS,
        set: null,
        mindMethods,
        activeCustomRotation: makeRotation(CLASS, {
          steps: [makeStep({ skillId: SKILL.herosBlood, hitCount: 2 })],
          openingStacks: { [STATUS.bingePoints]: 100 },
        }),
      })
    }
    const herosBloodDamage = (result: ReturnType<typeof runHerosBlood>) =>
      result.perSkill.find((row) => row.breakdownName === "Hero's Blood")!.expectedDamage

    const tier1 = mindMethodsWith(INNER_WAY_ID.volutefit, 1)
    const peakfallRatio = peakfallDamage(runPeakfall(tier1)) / peakfallDamage(runPeakfall(UNSLOTTED))
    const herosBloodRatio = herosBloodDamage(runHerosBlood(tier1)) / herosBloodDamage(runHerosBlood(UNSLOTTED))
    expect(herosBloodRatio).toBeCloseTo(1, 6)
    expect(peakfallRatio).toBeGreaterThan(herosBloodRatio)
  })
})
