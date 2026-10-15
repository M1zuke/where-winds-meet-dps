import { describe, expect, it } from "vitest"
import {
  averageEnhancementBonus,
  averageEnhancementLevel,
  defaultEnhancementLevels,
  enhancementCap,
  enhancementContributions,
  enhancementHpTotal,
  enhancementPhysDefTotal,
  enhancementStatsAtLevel,
  getConfiguredBase,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import { GEAR_SLOTS } from "../../src/engine/types"
import type { EnhancementLevels, Inputs } from "../../src/engine/types"

const LEVEL_65: EnhancementLevels = Object.fromEntries(
  GEAR_SLOTS.map((slot) => [slot, 65]),
) as EnhancementLevels

describe("the per-slot enhancement ladder", () => {
  it("grants the level-65 figures the ladder authors", () => {
    expect(enhancementStatsAtLevel("leftWeapon", 65)).toEqual({ minPhys: 120, maxPhys: 80 })
    expect(enhancementStatsAtLevel("disc", 65)).toEqual({ maxPhys: 160 })
    expect(enhancementStatsAtLevel("helm", 65)).toEqual({ maxHp: 8934 })
    expect(enhancementStatsAtLevel("armor", 65)).toEqual({ maxHp: 6169, physDef: 60 })
  })

  it("grants a cumulative total, not a sum of every level up to it", () => {
    expect(enhancementStatsAtLevel("leftWeapon", 1)).toEqual({ minPhys: 1, maxPhys: 1 })
    expect(enhancementStatsAtLevel("leftWeapon", 2)).toEqual({ minPhys: 2, maxPhys: 2 })
  })

  it("grants nothing at level zero", () => {
    for (const slot of GEAR_SLOTS) expect(enhancementStatsAtLevel(slot, 0)).toEqual({})
  })

  it("armour grants no attack of any kind at any level", () => {
    for (const slot of ["helm", "bracer", "armor", "greaves"] as const) {
      for (const level of [1, 33, 65]) {
        const stats = enhancementStatsAtLevel(slot, level)
        expect(stats.minPhys).toBeUndefined()
        expect(stats.maxPhys).toBeUndefined()
      }
    }
  })
})

describe("default enhancement levels", () => {
  it("defaults all eight slots to the highest level the breakthrough allows", () => {
    for (const [breakthrough, level] of [
      [13, 45],
      [17, 65],
      [19, 75],
      [20, 80],
      [21, 80],
    ] as const) {
      const levels = defaultEnhancementLevels(breakthrough)
      for (const slot of GEAR_SLOTS) expect(levels[slot]).toBe(level)
    }
  })

  it("defaultEnhancementLevels() returns a fresh object each call", () => {
    const first = defaultEnhancementLevels(17)
    const second = defaultEnhancementLevels(17)
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe("enhancementContributions — the attack stat feeding the damage base", () => {
  it("sums the four attack slots to the level-65 totals the anchors depend on", () => {
    const out = enhancementContributions(LEVEL_65)
    expect(out["phys.min"]).toBeCloseTo(240, 6)
    expect(out["phys.max"]).toBeCloseTo(480, 6)
  })

  it("getConfiguredBase seeds the breakthrough default when inputs.enhancements is absent", () => {
    const legacy = { ...defaultInputs } as Partial<Inputs>
    delete legacy.enhancements
    const withoutField = getConfiguredBase(legacy as Inputs, [])
    const withField = getConfiguredBase(
      { ...defaultInputs, enhancements: defaultEnhancementLevels(defaultInputs.breakthrough) },
      [],
    )
    expect(withoutField["phys.min"]).toBeCloseTo(withField["phys.min"], 6)
    expect(withoutField["phys.max"]).toBeCloseTo(withField["phys.max"], 6)
  })

  it("lowering one slot's level lowers the base by exactly that level's grant", () => {
    const inputs: Inputs = { ...defaultInputs, enhancements: LEVEL_65 }
    const lowered = { ...LEVEL_65, disc: 10 }
    const before = getConfiguredBase(inputs, [])
    const after = getConfiguredBase({ ...inputs, enhancements: lowered }, [])
    const droppedMax =
      enhancementStatsAtLevel("disc", 65).maxPhys! - enhancementStatsAtLevel("disc", 10).maxPhys!
    expect(before["phys.max"] - after["phys.max"]).toBeCloseTo(droppedMax, 6)
  })

  it("an empty (level zero) armour slot contributes nothing", () => {
    const zeroed = { ...LEVEL_65, helm: 0 }
    expect(enhancementHpTotal(zeroed)).toBeLessThan(enhancementHpTotal(LEVEL_65))
  })
})

describe("the armour totals at the level-65 cap", () => {
  it("matches the in-game 30 206 Max HP and 120 Physical Defense", () => {
    expect(enhancementHpTotal(LEVEL_65)).toBe(30206)
    expect(enhancementPhysDefTotal(LEVEL_65)).toBe(120)
  })
})

describe("the average-level bonus layer", () => {
  it("floors the eight-slot average and reports the level-65 grant", () => {
    expect(averageEnhancementLevel(LEVEL_65)).toBe(65)
    expect(averageEnhancementBonus(LEVEL_65)).toEqual({ maxHp: 9864, percent: 0.2 })
  })

  it("takes the highest average_enhance_bonus row at or below the average", () => {
    const levels = { ...LEVEL_65 }
    for (const slot of GEAR_SLOTS) levels[slot] = 0
    levels.leftWeapon = 32 // average = 4, below the first (level 5) row
    expect(averageEnhancementLevel(levels)).toBe(4)
    expect(averageEnhancementBonus(levels)).toEqual({ maxHp: 0, percent: 0 })
  })

  it("grants no passive percentage below average level 30", () => {
    const levels = { ...LEVEL_65 }
    for (const slot of GEAR_SLOTS) levels[slot] = 25
    expect(averageEnhancementBonus(levels).percent).toBe(0)
  })
})

describe("enhancementCap", () => {
  it("matches the effective cap per breakthrough at that breakthrough's own gear level", () => {
    expect(enhancementCap(86, 13)).toBe(45)
    expect(enhancementCap(91, 14)).toBe(50)
    expect(enhancementCap(91, 15)).toBe(55)
    expect(enhancementCap(96, 16)).toBe(60)
    expect(enhancementCap(96, 17)).toBe(65)
  })

  it("reaches 70 at world level 18 and 75 at world level 19", () => {
    expect(enhancementCap(100, 18)).toBe(70)
    expect(enhancementCap(100, 19)).toBe(75)
  })

  it("caps at the season ceiling of 80 from world level 20 on", () => {
    expect(enhancementCap(105, 20)).toBe(80)
    expect(enhancementCap(105, 21)).toBe(80)
  })

  it("grants the level-76 to level-85 figures the ladder authors", () => {
    expect(enhancementStatsAtLevel("leftWeapon", 80)).toEqual({ minPhys: 147, maxPhys: 98 })
    expect(enhancementStatsAtLevel("rightWeapon", 85)).toEqual({ minPhys: 156, maxPhys: 104 })
    expect(enhancementStatsAtLevel("pendant", 85)).toEqual({ maxPhys: 208 })
    expect(enhancementStatsAtLevel("bracer", 85)).toEqual({ maxHp: 11619 })
    expect(enhancementStatsAtLevel("greaves", 84)).toEqual({ maxHp: 7930, physDef: 77 })
    expect(enhancementStatsAtLevel("greaves", 85)).toEqual({ maxHp: 8023, physDef: 78 })
  })

  it("reads the average bonus at every 5-level threshold up to 85", () => {
    const uniform = (level: number) =>
      Object.fromEntries(GEAR_SLOTS.map((slot) => [slot, level])) as EnhancementLevels
    expect(averageEnhancementBonus(uniform(80))).toEqual({ maxHp: 12421, percent: 0.2 })
    expect(averageEnhancementBonus(uniform(85))).toEqual({ maxHp: 13364, percent: 0.2 })
  })

  it("grants the level-70 and level-75 figures the ladder authors", () => {
    expect(enhancementStatsAtLevel("leftWeapon", 70)).toEqual({ minPhys: 129, maxPhys: 86 })
    expect(enhancementStatsAtLevel("disc", 75)).toEqual({ maxPhys: 184 })
    expect(enhancementStatsAtLevel("helm", 75)).toEqual({ maxHp: 10276 })
    expect(enhancementStatsAtLevel("armor", 75)).toEqual({ maxHp: 7096, physDef: 69 })
  })

  it("bounds the cap by the equipped piece's own gear level, not the breakthrough's", () => {
    expect(enhancementCap(1, 17)).toBeLessThan(enhancementCap(96, 17))
  })

  it("floors at zero for an unreachable combination", () => {
    expect(enhancementCap(0, 0)).toBe(0)
  })
})
