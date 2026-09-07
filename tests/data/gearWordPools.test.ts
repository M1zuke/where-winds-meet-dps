import { describe, expect, it } from "vitest"
import {
  gearWordPool,
  gearWordPoolForLine,
  gearWordPoolInitial,
  gearWordPoolRetune,
  gearWordSlotGroup,
  isRetunableLine,
} from "../../src/data/stats/gearWordPools"
import { GEAR_LEVELS, GEAR_SLOTS } from "../../src/engine/types"

const PENETRATION_WORDS = [
  "physicalPenetration",
  "bellstrikePenetration",
  "stonesplitPenetration",
  "silkbindPenetration",
  "bamboocutPenetration",
  "formlessPenetration",
]

describe("gearWordSlotGroup", () => {
  it("groups the eight main-panel slots into weapon, discPendant, helmArmor and greavesBracer", () => {
    expect(gearWordSlotGroup("leftWeapon")).toBe("weapon")
    expect(gearWordSlotGroup("rightWeapon")).toBe("weapon")
    expect(gearWordSlotGroup("disc")).toBe("discPendant")
    expect(gearWordSlotGroup("pendant")).toBe("discPendant")
    expect(gearWordSlotGroup("helm")).toBe("helmArmor")
    expect(gearWordSlotGroup("armor")).toBe("helmArmor")
    expect(gearWordSlotGroup("greaves")).toBe("greavesBracer")
    expect(gearWordSlotGroup("bracer")).toBe("greavesBracer")
  })
})

describe("every level and slot has both an initial and a retune pool", () => {
  it.each(GEAR_LEVELS)("level %s offers at least one word per slot, both pools", (level) => {
    for (const slot of GEAR_SLOTS) {
      expect(gearWordPoolInitial(level, slot).length).toBeGreaterThan(0)
      expect(gearWordPoolRetune(level, slot).length).toBeGreaterThan(0)
      expect(gearWordPool(level, slot).length).toBeGreaterThan(0)
    }
  })
})

describe("penetration never rolls as a normal word", () => {
  it.each(GEAR_LEVELS)("level %s offers no penetration word on any slot", (level) => {
    for (const slot of GEAR_SLOTS) {
      const pool = gearWordPool(level, slot)
      for (const word of PENETRATION_WORDS) expect(pool).not.toContain(word)
    }
  })
})

describe("a disc's first line", () => {
  it.each([96, 100, 105] as const)("level %s offers exactly minPhys and maxPhys", (level) => {
    expect([...gearWordPoolInitial(level, "disc")].sort()).toEqual(["maxPhys", "minPhys"])
  })

  it.each([86, 91] as const)("level %s also offers the attribute-attack pairs", (level) => {
    const pool = gearWordPoolInitial(level, "disc")
    expect(pool).toContain("minPhys")
    expect(pool).toContain("maxPhys")
    expect(pool).toContain("minBellstrike")
  })
})

describe("a weapon's first line", () => {
  it.each(GEAR_LEVELS)("level %s offers no rate word", (level) => {
    const pool = gearWordPoolInitial(level, "leftWeapon")
    expect(pool).not.toContain("crit")
    expect(pool).not.toContain("precision")
    expect(pool).not.toContain("affinity")
  })

  it.each(GEAR_LEVELS)("level %s offers every attribute-attack pair", (level) => {
    const pool = gearWordPoolInitial(level, "leftWeapon")
    expect(pool).toContain("minBellstrike")
    expect(pool).toContain("minStonesplit")
    expect(pool).toContain("minSilkbind")
    expect(pool).toContain("minBamboocut")
  })
})

describe("the four attribute-attack pairs are unreachable by retuning a weapon", () => {
  it.each(GEAR_LEVELS)("level %s offers none of them via the retune pool", (level) => {
    const pool = gearWordPoolRetune(level, "leftWeapon")
    expect(pool).not.toContain("minBellstrike")
    expect(pool).not.toContain("minStonesplit")
    expect(pool).not.toContain("minSilkbind")
    expect(pool).not.toContain("minBamboocut")
  })
})

describe("gearWordPoolForLine", () => {
  it("holds a weapon's first line to the initial pool, which carries no rate word", () => {
    const pool = gearWordPoolForLine(96, "leftWeapon", 0)
    expect(pool).not.toContain("crit")
    expect(pool).not.toContain("precision")
    expect(pool).toContain("minBellstrike")
  })

  it("holds a disc's first line to physical attack alone", () => {
    expect([...gearWordPoolForLine(96, "disc", 0)].sort()).toEqual(["maxPhys", "minPhys"])
  })

  it("never widens the first line, because the initial affix cannot be retuned", () => {
    for (const level of [86, 91, 96, 100, 105] as const) {
      expect(gearWordPoolForLine(level, "leftWeapon", 0)).toEqual(
        gearWordPoolInitial(level, "leftWeapon"),
      )
    }
  })

  it("draws every line after the first from the retune pool", () => {
    for (const lineIndex of [1, 2, 3, 4]) {
      expect(gearWordPoolForLine(96, "leftWeapon", lineIndex)).toEqual(
        gearWordPoolRetune(96, "leftWeapon"),
      )
    }
  })

  it("marks only the lines after the first as retunable", () => {
    expect(isRetunableLine(0)).toBe(false)
    expect(isRetunableLine(1)).toBe(true)
    expect(isRetunableLine(4)).toBe(true)
  })
})
