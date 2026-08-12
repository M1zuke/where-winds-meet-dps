import { describe, expect, it } from "vitest"
import { gearBaseStatsFor, inferGearIdentity } from "../../src/engine/gearStats"
import { GEAR_SLOTS, type GearLevel, type GearRarity } from "../../src/engine/types"

const TABLED_LEVELS: GearLevel[] = [91, 96]
const RARITIES: GearRarity[] = ["legendary", "epic"]

describe("inferGearIdentity", () => {
  it("pins both axes for a weapon slot", () => {
    for (const level of TABLED_LEVELS) {
      for (const rarity of RARITIES) {
        const observed = gearBaseStatsFor({ slot: "leftWeapon", level, rarity })
        expect(inferGearIdentity("leftWeapon", observed)).toMatchObject({ level, rarity })
      }
    }
  })

  it("pins both axes for every slot, weapon and armor alike", () => {
    for (const slot of GEAR_SLOTS) {
      for (const level of TABLED_LEVELS) {
        for (const rarity of RARITIES) {
          const observed = gearBaseStatsFor({ slot, level, rarity })
          expect(inferGearIdentity(slot, observed), `${slot} lv${level} ${rarity}`).toMatchObject({
            level,
            rarity,
          })
        }
      }
    }
  })

  it("leaves an axis null when the observed stats cannot pin it", () => {
    const helm = gearBaseStatsFor({ slot: "helm", level: 96, rarity: "legendary" })
    expect(inferGearIdentity("helm", { hp: helm.hp })).toMatchObject({
      level: 96,
      rarity: "legendary",
    })
    expect(inferGearIdentity("greaves", { hp: helm.hp })).toMatchObject({
      level: 96,
      rarity: "legendary",
    })
  })

  it("compares only the fields the slot actually carries", () => {
    const observed = gearBaseStatsFor({ slot: "disc", level: 96, rarity: "legendary" })
    expect(inferGearIdentity("disc", { minPhys: observed.minPhys })).toMatchObject({
      level: 96,
      rarity: "legendary",
    })
  })

  it("reports no candidates for stats outside the table", () => {
    expect(inferGearIdentity("leftWeapon", { minPhys: 1, maxPhys: 2 })).toEqual({
      level: null,
      rarity: null,
      candidates: [],
    })
  })

  it("reports no candidates when nothing was observed", () => {
    expect(inferGearIdentity("helm", {}).candidates).toEqual([])
  })
})
