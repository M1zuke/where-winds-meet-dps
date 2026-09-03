import { describe, expect, it } from "vitest"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "../../src/data/innerWays/ids"
import { INNER_WAY_LADDERS } from "../../src/data/innerWays/breakthroughLadders"
import { INNER_WAYS, innerWayLadderStats } from "../../src/definitions/innerWays/registry"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"
import { getMindMethodContributions } from "../../src/definitions/baseStats"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

function contributions(innerWayId: string, breakthrough: number, stacks = "tier 6") {
  return getMindMethodContributions({
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    breakthrough,
    mindMethods: [
      { name: innerWayId, stacks },
      emptyMindMethod,
      emptyMindMethod,
      emptyMindMethod,
    ] as Inputs["mindMethods"],
  })
}

describe("inner-way breakthrough ladders", () => {
  it("every ladder has a row for every breakthrough tier the app models", () => {
    for (const ladder of Object.values(INNER_WAY_LADDER)) {
      for (const tier of BREAKTHROUGH_TIERS) {
        expect(
          INNER_WAY_LADDERS[ladder][tier.breakthrough],
          `${ladder} @${tier.breakthrough}`,
        ).toBeDefined()
      }
    }
  })

  it("every tier ladder an inner way names is a declared ladder", () => {
    for (const def of INNER_WAYS) {
      for (const tier of Object.values(def.tiers ?? {})) {
        if (tier.ladder) expect(INNER_WAY_LADDERS[tier.ladder], `${def.id}`).toBeDefined()
      }
    }
  })

  it("a ladder line follows the build's breakthrough", () => {
    const atSixteen = contributions(INNER_WAY_ID.insightfulStrike, 16)
    const atSeventeen = contributions(INNER_WAY_ID.insightfulStrike, 17)
    expect(atSeventeen["phys.max"]).toBeGreaterThan(atSixteen["phys.max"])
    expect(atSeventeen["phys.max"]).toBeCloseTo(
      INNER_WAY_LADDERS.weaponAttackFourStar[17]["phys.max"]!,
      10,
    )
    expect(atSixteen["phys.max"]).toBeCloseTo(
      INNER_WAY_LADDERS.weaponAttackFourStar[16]["phys.max"]!,
      10,
    )
  })

  it("a fixed tier line stays put across breakthroughs", () => {
    expect(contributions(INNER_WAY_ID.insightfulStrike, 16)["phys.penetration"]).toBeCloseTo(
      contributions(INNER_WAY_ID.insightfulStrike, 21)["phys.penetration"],
      10,
    )
  })

  it("a breakthrough outside the ladder resolves to the nearest row", () => {
    expect(innerWayLadderStats(INNER_WAY_LADDER.precisionFourStar, 30)).toBe(
      INNER_WAY_LADDERS.precisionFourStar[21],
    )
    expect(innerWayLadderStats(INNER_WAY_LADDER.precisionFourStar, 3)).toBe(
      INNER_WAY_LADDERS.precisionFourStar[12],
    )
  })

  it("a ladder line is absent below the tier that unlocks it", () => {
    expect(contributions(INNER_WAY_ID.battleAnthem, 17, "tier 2").affinityRate ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.battleAnthem, 17, "tier 3").affinityRate).toBeCloseTo(
      INNER_WAY_LADDERS.affinityRateFourStar[17].affinityRate!,
      10,
    )
  })
})
