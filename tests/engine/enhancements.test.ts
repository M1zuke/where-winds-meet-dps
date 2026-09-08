import { describe, expect, it } from "vitest"
import {
  averageEnhancementBonus,
  averageEnhancementLevel,
  DEFAULT_ENHANCEMENT_LEVEL,
  DEFAULT_ENHANCEMENTS,
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
import type { Inputs } from "../../src/engine/types"

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
  it("defaults every one of the eight slots to level 65, independent of breakthrough", () => {
    for (const slot of GEAR_SLOTS) expect(DEFAULT_ENHANCEMENTS[slot]).toBe(65)
    expect(DEFAULT_ENHANCEMENT_LEVEL).toBe(65)
  })

  it("defaultEnhancementLevels() returns a fresh object each call", () => {
    const first = defaultEnhancementLevels()
    const second = defaultEnhancementLevels()
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe("enhancementContributions — the attack stat feeding the damage base", () => {
  it("sums the four attack slots to the level-65 totals the anchors depend on", () => {
    const out = enhancementContributions(DEFAULT_ENHANCEMENTS)
    expect(out["phys.min"]).toBeCloseTo(240, 6)
    expect(out["phys.max"]).toBeCloseTo(480, 6)
  })

  it("getConfiguredBase seeds DEFAULT_ENHANCEMENTS when inputs.enhancements is absent", () => {
    const legacy = { ...defaultInputs } as Partial<Inputs>
    delete legacy.enhancements
    const withoutField = getConfiguredBase(legacy as Inputs, [])
    const withField = getConfiguredBase(
      { ...defaultInputs, enhancements: DEFAULT_ENHANCEMENTS },
      [],
    )
    expect(withoutField["phys.min"]).toBeCloseTo(withField["phys.min"], 6)
    expect(withoutField["phys.max"]).toBeCloseTo(withField["phys.max"], 6)
  })

  it("lowering one slot's level lowers the base by exactly that level's grant", () => {
    const inputs: Inputs = { ...defaultInputs, enhancements: DEFAULT_ENHANCEMENTS }
    const lowered = { ...DEFAULT_ENHANCEMENTS, disc: 10 }
    const before = getConfiguredBase(inputs, [])
    const after = getConfiguredBase({ ...inputs, enhancements: lowered }, [])
    const droppedMax =
      enhancementStatsAtLevel("disc", 65).maxPhys! - enhancementStatsAtLevel("disc", 10).maxPhys!
    expect(before["phys.max"] - after["phys.max"]).toBeCloseTo(droppedMax, 6)
  })

  it("an empty (level zero) armour slot contributes nothing", () => {
    const zeroed = { ...DEFAULT_ENHANCEMENTS, helm: 0 }
    expect(enhancementHpTotal(zeroed)).toBeLessThan(enhancementHpTotal(DEFAULT_ENHANCEMENTS))
  })
})

describe("the armour totals at the level-65 cap", () => {
  it("matches the in-game 30 206 Max HP and 120 Physical Defense", () => {
    expect(enhancementHpTotal(DEFAULT_ENHANCEMENTS)).toBe(30206)
    expect(enhancementPhysDefTotal(DEFAULT_ENHANCEMENTS)).toBe(120)
  })
})

describe("the average-level bonus layer", () => {
  it("floors the eight-slot average and reports the level-65 grant", () => {
    expect(averageEnhancementLevel(DEFAULT_ENHANCEMENTS)).toBe(65)
    expect(averageEnhancementBonus(DEFAULT_ENHANCEMENTS)).toEqual({ maxHp: 9864, percent: 0.2 })
  })

  it("takes the highest average_enhance_bonus row at or below the average", () => {
    const levels = { ...defaultEnhancementLevels() }
    for (const slot of GEAR_SLOTS) levels[slot] = 0
    levels.leftWeapon = 32 // average = 4, below the first (level 5) row
    expect(averageEnhancementLevel(levels)).toBe(4)
    expect(averageEnhancementBonus(levels)).toEqual({ maxHp: 0, percent: 0 })
  })

  it("grants no passive percentage below average level 30", () => {
    const levels = { ...defaultEnhancementLevels() }
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

  it("never offers a level above 65, since the ladder has no rows past it", () => {
    expect(enhancementCap(100, 18)).toBe(65)
    expect(enhancementCap(100, 19)).toBe(65)
    expect(enhancementCap(105, 20)).toBe(65)
    expect(enhancementCap(105, 21)).toBe(65)
  })

  it("bounds the cap by the equipped piece's own gear level, not the breakthrough's", () => {
    expect(enhancementCap(1, 17)).toBeLessThan(enhancementCap(96, 17))
  })

  it("floors at zero for an unreachable combination", () => {
    expect(enhancementCap(0, 0)).toBe(0)
  })
})
