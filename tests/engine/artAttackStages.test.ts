import { describe, expect, it } from "vitest"
import {
  artAttackStageAt,
  SHARED_ART_ATTACK_LADDER,
} from "../../src/data/baseStats/artAttackStages"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"

describe("art attack stage ladder", () => {
  it("resolves 98/196 from breakthrough 13 through 17", () => {
    for (const breakthrough of [13, 14, 15, 16, 17]) {
      expect(artAttackStageAt("bellstrikeUmbra", breakthrough)).toEqual({ min: 98, max: 196 })
    }
  })

  it("resolves 106/212 at breakthrough 18 and 133/266 at breakthrough 21", () => {
    expect(artAttackStageAt("bellstrikeUmbra", 18)).toEqual({ min: 106, max: 212 })
    expect(artAttackStageAt("bellstrikeUmbra", 21)).toEqual({ min: 133, max: 266 })
  })

  it("extends Bamboocut Draught's ladder to 143/286 at 22 and 153/306 at 23", () => {
    expect(artAttackStageAt("bamboocutDraught", 22)).toEqual({ min: 143, max: 286 })
    expect(artAttackStageAt("bamboocutDraught", 23)).toEqual({ min: 153, max: 306 })
  })

  it("floors another class's ladder at 21 rather than extending it", () => {
    expect(artAttackStageAt("bellstrikeUmbra", 22)).toEqual({ min: 133, max: 266 })
    expect(artAttackStageAt("bellstrikeUmbra", 23)).toEqual({ min: 133, max: 266 })
  })

  it("falls back to the shared ladder for an unknown class id", () => {
    expect(artAttackStageAt("notARealClass", 21)).toEqual({ min: 133, max: 266 })
  })

  it("does not throw for an out-of-range breakthrough", () => {
    expect(() => artAttackStageAt("bellstrikeUmbra", 0)).not.toThrow()
    expect(() => artAttackStageAt("bellstrikeUmbra", 999)).not.toThrow()
    expect(artAttackStageAt("bellstrikeUmbra", 0)).toEqual({ min: 98, max: 196 })
  })

  it("the art attack stage ladder reaches the highest breakthrough the app offers", () => {
    const highest = Math.max(...BREAKTHROUGH_TIERS.map((tier) => tier.breakthrough))
    const topLadderKey = Math.max(...Object.keys(SHARED_ART_ATTACK_LADDER).map(Number))
    expect(topLadderKey).toBeGreaterThanOrEqual(highest)
  })
})
