import { describe, expect, it } from "vitest"
import { retuneWeightPool, type RetuneLine } from "../../src/data/stats/gearRetuneWeights"
import { exactMaxWithinLineChance } from "../../src/engine/retunement"
import { GEAR_LEVELS } from "../../src/engine/types"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"

const REGISTERED_ATTRIBUTES = [
  ...new Set(CLASS_DEFS().map((classDef) => classDef.primaryAttribute)),
]

function line(pool: readonly RetuneLine[], word: string): RetuneLine {
  const found = pool.find((candidate) => candidate.word === word)
  if (!found) throw new Error(`no line for ${word}`)
  return found
}

describe("retuneWeightPool", () => {
  it.each(REGISTERED_ATTRIBUTES)("has weighted data for %s at 96, 100 and 105", (attribute) => {
    for (const level of [96, 100, 105] as const) {
      expect(retuneWeightPool(attribute, level, "leftWeapon")).not.toBeNull()
      expect(retuneWeightPool(attribute, level, "helm")).not.toBeNull()
    }
  })

  it.each(REGISTERED_ATTRIBUTES)(
    "has no weighted data for %s at 86 or 91 — not in the referenced pool tables",
    (attribute) => {
      expect(retuneWeightPool(attribute, 86, "leftWeapon")).toBeNull()
      expect(retuneWeightPool(attribute, 91, "leftWeapon")).toBeNull()
    },
  )

  it.each(REGISTERED_ATTRIBUTES)(
    "sums %s weapon weights to 4839 for Bellstrike and 4407 otherwise, at every level",
    (attribute) => {
      const expected = attribute === "Bellstrike" ? 4839 : 4407
      for (const level of [96, 100, 105] as const) {
        const pool = retuneWeightPool(attribute, level, "leftWeapon")!
        expect(pool.reduce((sum, l) => sum + l.weight, 0)).toBe(expected)
      }
    },
  )

  it.each([
    ["Bellstrike", "maxBellstrike"],
    ["Stonesplit", "maxStonesplit"],
    ["Silkbind", "maxSilkbind"],
    ["Bamboocut", "maxBamboocut"],
  ] as const)(
    "uses %s's own armour attack word, distinct from the weapon's",
    (attribute, armourWord) => {
      const weapon = retuneWeightPool(attribute, 96, "leftWeapon")!
      const armour = retuneWeightPool(attribute, 96, "helm")!
      expect(weapon.some((l) => l.word === "maxFormless")).toBe(true)
      expect(armour.some((l) => l.word === armourWord)).toBe(true)
      expect(armour.some((l) => l.word === "maxFormless")).toBe(false)
    },
  )

  it.each(REGISTERED_ATTRIBUTES)("never offers a %s line unreachable by retuning", (attribute) => {
    for (const level of GEAR_LEVELS) {
      const pool = retuneWeightPool(attribute, level, "leftWeapon")
      if (!pool) continue
      const words = pool.map((l) => l.word)
      expect(words).not.toContain("precision")
      expect(words).not.toContain("minFormless")
      expect(words).not.toContain("swordBoost")
    }
  })

  it("shares the same six-line shape between disc/pendant, helm/armor and greaves/bracer", () => {
    const helm = retuneWeightPool("Bellstrike", 96, "helm")!
    const armor = retuneWeightPool("Bellstrike", 96, "armor")!
    const disc = retuneWeightPool("Bellstrike", 96, "disc")!
    const greaves = retuneWeightPool("Bellstrike", 96, "greaves")!
    expect(helm).toEqual(armor)
    expect(helm).toEqual(disc)
    expect(helm).toEqual(greaves)
  })
})

describe("exactMaxWithinLineChance — the P(exact max) anchor", () => {
  it("reproduces BASH_PROB, CRI_PROB and MAX_W_ATK at level 96, 5★", () => {
    const pool = retuneWeightPool("Bellstrike", 96, "leftWeapon")!
    const bash = exactMaxWithinLineChance(line(pool, "affinity"), "legendary", "percent")
    const crit = exactMaxWithinLineChance(line(pool, "crit"), "legendary", "percent")
    const maxAtk = exactMaxWithinLineChance(line(pool, "maxPhys"), "legendary", "raw")

    expect(bash).toBeCloseTo(0.1, 4)
    expect(crit).toBeCloseTo(0.0444, 4)
    expect(maxAtk).toBeCloseTo(0.0051, 4)
  })

  it("is a quarter as likely at 3★/4★ as at 5★, for a band-40/10 line", () => {
    const pool = retuneWeightPool("Bellstrike", 96, "leftWeapon")!
    const star5 = exactMaxWithinLineChance(line(pool, "affinity"), "legendary", "percent")
    const lowerStar = exactMaxWithinLineChance(line(pool, "affinity"), "epic", "percent")
    expect(lowerStar).toBeCloseTo(star5 / 4, 6)
  })
})
