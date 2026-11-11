import { describe, expect, it } from "vitest"
import {
  artAttackStageAt,
  SHARED_ART_ATTACK_LADDER,
} from "../../src/data/baseStats/artAttackStages"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"

describe("art attack stage ladder", () => {
  it("resolves 69/138 at breakthrough 13 and 80/160 at breakthrough 14", () => {
    expect(artAttackStageAt(13)).toEqual({ min: 69, max: 138 })
    expect(artAttackStageAt(14)).toEqual({ min: 80, max: 160 })
  })

  it("resolves 98/196 from breakthrough 15 through 17", () => {
    for (const breakthrough of [15, 16, 17]) {
      expect(artAttackStageAt(breakthrough)).toEqual({ min: 98, max: 196 })
    }
  })

  it("resolves 106/212 at breakthrough 18 and 133/266 at breakthrough 21", () => {
    expect(artAttackStageAt(18)).toEqual({ min: 106, max: 212 })
    expect(artAttackStageAt(21)).toEqual({ min: 133, max: 266 })
  })

  it("resolves 143/286 at breakthrough 22 and 153/306 at breakthrough 23", () => {
    expect(artAttackStageAt(22)).toEqual({ min: 143, max: 286 })
    expect(artAttackStageAt(23)).toEqual({ min: 153, max: 306 })
  })

  it("holds the last stage above breakthrough 23", () => {
    expect(artAttackStageAt(24)).toEqual({ min: 153, max: 306 })
  })

  it("does not throw for an out-of-range breakthrough", () => {
    expect(() => artAttackStageAt(0)).not.toThrow()
    expect(() => artAttackStageAt(999)).not.toThrow()
    expect(artAttackStageAt(0)).toEqual({ min: 69, max: 138 })
  })

  it("the art attack stage ladder reaches the highest breakthrough the app offers", () => {
    const highest = Math.max(...BREAKTHROUGH_TIERS.map((tier) => tier.breakthrough))
    const topLadderKey = Math.max(...Object.keys(SHARED_ART_ATTACK_LADDER).map(Number))
    expect(topLadderKey).toBeGreaterThanOrEqual(highest)
  })
})
