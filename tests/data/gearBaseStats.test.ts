import { describe, expect, it } from "vitest"
import { gearBaseStatsFor } from "../../src/data/stats/gearBaseStats"
import { GEAR_SLOTS } from "../../src/engine/types"

describe("gearBaseStatsFor — 86, 100 and 105", () => {
  it.each(GEAR_SLOTS)("%s differs from its neighbouring level at legendary", (slot) => {
    const lv86 = gearBaseStatsFor({ slot, level: 86, rarity: "legendary" })
    const lv91 = gearBaseStatsFor({ slot, level: 91, rarity: "legendary" })
    const lv100 = gearBaseStatsFor({ slot, level: 100, rarity: "legendary" })
    const lv105 = gearBaseStatsFor({ slot, level: 105, rarity: "legendary" })

    expect(lv86).not.toEqual(lv91)
    expect(lv100).not.toEqual(lv91)
    expect(lv105).not.toEqual(lv100)
  })

  it.each(GEAR_SLOTS)("%s rises monotonically from 86 through 105 at legendary", (slot) => {
    const totalOf = (level: 86 | 91 | 96 | 100 | 105) => {
      const base = gearBaseStatsFor({ slot, level, rarity: "legendary" })
      return base.minPhys + base.maxPhys + base.hp + base.physDef
    }
    const totals = [86, 91, 96, 100, 105].map((level) => totalOf(level as 86 | 91 | 96 | 100 | 105))
    for (let index = 1; index < totals.length; index++) {
      expect(totals[index]).toBeGreaterThan(totals[index - 1]!)
    }
  })

  it("a level-86 legendary left weapon reads its own tier, not level 91's", () => {
    expect(gearBaseStatsFor({ slot: "leftWeapon", level: 86, rarity: "legendary" })).toEqual({
      minPhys: 46,
      maxPhys: 106,
      hp: 0,
      physDef: 0,
    })
  })

  it("a level-100 epic disc reads its own tier", () => {
    expect(gearBaseStatsFor({ slot: "disc", level: 100, rarity: "epic" })).toMatchObject({
      minPhys: 90,
    })
  })

  it("a level-105 epic helm reads its own tier", () => {
    expect(gearBaseStatsFor({ slot: "helm", level: 105, rarity: "epic" })).toMatchObject({
      hp: 7402,
      physDef: 27,
    })
  })
})
