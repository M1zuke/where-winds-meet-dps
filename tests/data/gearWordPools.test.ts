import { describe, expect, it } from "vitest"
import {
  gearWordPool,
  gearWordPoolForLine,
  gearWordPoolInitial,
  gearWordPoolRetune,
  gearWordSlotGroup,
  isRetunableLine,
} from "../../src/data/stats/gearWordPools"
import { WEAPON_BOOST_STAT_KEY } from "../../src/data/stats/weaponBoosts"
import { GEAR_LEVELS, GEAR_SLOTS, WEAPON_NAMES } from "../../src/engine/types"

const MARTIAL_ART_BOOST_WORDS = [
  "swordBoost",
  "spearBoost",
  "fanBoost",
  "umbrellaBoost",
  "modaoBoost",
  "dualKnivesBoost",
  "ropeDartBoost",
  "hengDaoBoost",
  "gauntletsBoost",
]

const ATTRIBUTE_ATTACK_WORDS = [
  "minBellstrike",
  "maxBellstrike",
  "minStonesplit",
  "maxStonesplit",
  "minSilkbind",
  "maxSilkbind",
  "minBamboocut",
  "maxBamboocut",
]

const FORMLESS_ATTACK_WORDS = ["minFormless", "maxFormless"]

const ARMOUR_SLOTS = ["disc", "pendant", "helm", "armor", "greaves", "bracer"] as const

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
      expect(gearWordPoolInitial(level, slot, null).length).toBeGreaterThan(0)
      expect(gearWordPoolRetune(level, slot, null).length).toBeGreaterThan(0)
      expect(gearWordPool(level, slot, null).length).toBeGreaterThan(0)
    }
  })
})

describe("penetration never rolls as a normal word", () => {
  it.each(GEAR_LEVELS)("level %s offers no penetration word on any slot", (level) => {
    for (const slot of GEAR_SLOTS) {
      const pool = gearWordPool(level, slot, null)
      for (const word of PENETRATION_WORDS) expect(pool).not.toContain(word)
    }
  })
})

describe("a disc's first line", () => {
  it.each([96, 100, 105] as const)("level %s offers exactly minPhys and maxPhys", (level) => {
    expect([...gearWordPoolInitial(level, "disc", null)].sort()).toEqual(["maxPhys", "minPhys"])
  })

  it.each([86, 91] as const)("level %s also offers the attribute-attack pairs", (level) => {
    const pool = gearWordPoolInitial(level, "disc", null)
    expect(pool).toContain("minPhys")
    expect(pool).toContain("maxPhys")
    expect(pool).toContain("minBellstrike")
  })
})

describe("a weapon's first line", () => {
  it.each(GEAR_LEVELS)("level %s offers no rate word", (level) => {
    const pool = gearWordPoolInitial(level, "leftWeapon", null)
    expect(pool).not.toContain("crit")
    expect(pool).not.toContain("precision")
    expect(pool).not.toContain("affinity")
  })
})

describe("both weapon slots carry every attribute-attack pair on every line", () => {
  it.each(GEAR_LEVELS)("level %s offers all eight from both pools", (level) => {
    for (const slot of ["leftWeapon", "rightWeapon"] as const) {
      for (const word of ATTRIBUTE_ATTACK_WORDS) {
        expect(gearWordPoolInitial(level, slot, "Sword")).toContain(word)
        expect(gearWordPoolRetune(level, slot, "Sword")).toContain(word)
      }
    }
  })
})

describe("a Formless attack word belongs to a weapon slot alone", () => {
  it.each(GEAR_LEVELS)("level %s offers neither on an armour slot", (level) => {
    for (const slot of ARMOUR_SLOTS) {
      for (const word of FORMLESS_ATTACK_WORDS)
        expect(gearWordPool(level, slot, null)).not.toContain(word)
    }
  })

  it.each([96, 100, 105] as const)("level %s offers both on either weapon", (level) => {
    for (const slot of ["leftWeapon", "rightWeapon"] as const) {
      for (const word of FORMLESS_ATTACK_WORDS)
        expect(gearWordPool(level, slot, "Sword")).toContain(word)
    }
  })

  it.each([86, 91] as const)("level %s has no Formless word on any slot", (level) => {
    for (const slot of GEAR_SLOTS) {
      for (const word of FORMLESS_ATTACK_WORDS)
        expect(gearWordPool(level, slot, null)).not.toContain(word)
    }
  })
})

describe("a weapon pool carries the boost of its own weapon type only", () => {
  it.each(GEAR_LEVELS)(
    "level %s keeps swordBoost and none of the other eight on a Sword",
    (level) => {
      const pool = gearWordPoolRetune(level, "leftWeapon", "Sword")
      expect(pool).toContain("swordBoost")
      for (const word of MARTIAL_ART_BOOST_WORDS.filter((boost) => boost !== "swordBoost"))
        expect(pool).not.toContain(word)
    },
  )

  it.each(GEAR_LEVELS)("level %s keeps all nine when the weapon type is unknown", (level) => {
    const pool = gearWordPoolRetune(level, "leftWeapon", null)
    for (const word of MARTIAL_ART_BOOST_WORDS) expect(pool).toContain(word)
  })

  it("derives every weapon type's boost from the one weapon-boost table", () => {
    for (const weapon of WEAPON_NAMES) {
      const pool = gearWordPoolRetune(96, "rightWeapon", weapon)
      expect(pool).toContain(WEAPON_BOOST_STAT_KEY[weapon])
    }
    expect(Object.values(WEAPON_BOOST_STAT_KEY).sort()).toEqual([...MARTIAL_ART_BOOST_WORDS].sort())
  })

  it("leaves non-weapon groups untouched by the weapon type", () => {
    for (const slot of ARMOUR_SLOTS) {
      expect(gearWordPoolRetune(86, slot, "Sword")).toEqual(gearWordPoolRetune(86, slot, null))
    }
  })
})

describe("disc and pendant carry no weapon-art boost", () => {
  it.each(GEAR_LEVELS)("level %s keeps allMartialBoost and none of the nine", (level) => {
    for (const slot of ["disc", "pendant"] as const) {
      const pool = gearWordPool(level, slot, null)
      expect(pool).toContain("allMartialBoost")
      for (const word of MARTIAL_ART_BOOST_WORDS) expect(pool).not.toContain(word)
    }
  })
})

describe("from level 96 a martial-art boost is a weapon line only", () => {
  it.each([96, 100, 105] as const)("level %s offers none of them on armour", (level) => {
    for (const slot of ["disc", "helm", "greaves"] as const) {
      const pool = gearWordPoolRetune(level, slot, null)
      for (const word of MARTIAL_ART_BOOST_WORDS) expect(pool).not.toContain(word)
    }
  })

  it.each([86, 91] as const)("level %s still offers them on helm and greaves", (level) => {
    for (const slot of ["helm", "greaves"] as const) {
      const pool = gearWordPoolRetune(level, slot, null)
      for (const word of MARTIAL_ART_BOOST_WORDS.filter((boost) => boost !== "gauntletsBoost"))
        expect(pool).toContain(word)
    }
  })
})

describe("gearWordPoolForLine", () => {
  it("holds a weapon's first line to the initial pool, which carries no rate word", () => {
    const pool = gearWordPoolForLine(96, "leftWeapon", 0, "Sword")
    expect(pool).not.toContain("crit")
    expect(pool).not.toContain("precision")
    expect(pool).toContain("minBellstrike")
  })

  it("holds a disc's first line to physical attack alone", () => {
    expect([...gearWordPoolForLine(96, "disc", 0, null)].sort()).toEqual(["maxPhys", "minPhys"])
  })

  it("never widens the first line, because the initial affix cannot be retuned", () => {
    for (const level of [86, 91, 96, 100, 105] as const) {
      expect(gearWordPoolForLine(level, "leftWeapon", 0, "Sword")).toEqual(
        gearWordPoolInitial(level, "leftWeapon", "Sword"),
      )
    }
  })

  it("draws every line after the first from the retune pool", () => {
    for (const lineIndex of [1, 2, 3, 4]) {
      expect(gearWordPoolForLine(96, "leftWeapon", lineIndex, "Sword")).toEqual(
        gearWordPoolRetune(96, "leftWeapon", "Sword"),
      )
    }
  })

  it("marks only the lines after the first as retunable", () => {
    expect(isRetunableLine(0)).toBe(false)
    expect(isRetunableLine(1)).toBe(true)
    expect(isRetunableLine(4)).toBe(true)
  })
})
