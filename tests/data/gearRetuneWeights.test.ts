import { describe, expect, it } from "vitest"
import { retuneWeightPool, type RetuneLine } from "../../src/data/stats/gearRetuneWeights"
import { exactMaxWithinLineChance } from "../../src/engine/retunement"
import { GEAR_LEVELS } from "../../src/engine/types"

function line(pool: readonly RetuneLine[], word: string): RetuneLine {
  const found = pool.find((candidate) => candidate.word === word)
  if (!found) throw new Error(`no line for ${word}`)
  return found
}

describe("retuneWeightPool", () => {
  it("has weighted data for every registered attribute at 96, 100 and 105", () => {
    for (const attribute of ["Bellstrike", "Stonesplit", "Silkbind"] as const) {
      for (const level of [96, 100, 105] as const) {
        expect(retuneWeightPool(attribute, level, "leftWeapon")).not.toBeNull()
        expect(retuneWeightPool(attribute, level, "helm")).not.toBeNull()
      }
    }
  })

  it("has no weighted data at 86 or 91 — not in the referenced pool tables", () => {
    for (const attribute of ["Bellstrike", "Stonesplit", "Silkbind"] as const) {
      expect(retuneWeightPool(attribute, 86, "leftWeapon")).toBeNull()
      expect(retuneWeightPool(attribute, 91, "leftWeapon")).toBeNull()
    }
  })

  it("has no entry for an unregistered attribute", () => {
    expect(retuneWeightPool("Bamboocut", 96, "leftWeapon")).toBeNull()
  })

  it("sums Bellstrike weapon weights to 4839 and non-Bellstrike to 4407, at every level", () => {
    for (const level of [96, 100, 105] as const) {
      const bellstrike = retuneWeightPool("Bellstrike", level, "leftWeapon")!
      const stonesplit = retuneWeightPool("Stonesplit", level, "leftWeapon")!
      expect(bellstrike.reduce((sum, l) => sum + l.weight, 0)).toBe(4839)
      expect(stonesplit.reduce((sum, l) => sum + l.weight, 0)).toBe(4407)
    }
  })

  it("uses the attribute's own armour attack word, distinct from the weapon's", () => {
    const weapon = retuneWeightPool("Bellstrike", 96, "leftWeapon")!
    const armour = retuneWeightPool("Bellstrike", 96, "helm")!
    expect(weapon.some((l) => l.word === "maxFormless")).toBe(true)
    expect(armour.some((l) => l.word === "maxBellstrike")).toBe(true)
    expect(armour.some((l) => l.word === "maxFormless")).toBe(false)
  })

  it("never offers a line unreachable by retuning", () => {
    for (const level of GEAR_LEVELS) {
      for (const attribute of ["Bellstrike", "Stonesplit", "Silkbind"] as const) {
        const pool = retuneWeightPool(attribute, level, "leftWeapon")
        if (!pool) continue
        const words = pool.map((l) => l.word)
        expect(words).not.toContain("precision")
        expect(words).not.toContain("minFormless")
        expect(words).not.toContain("swordBoost")
      }
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
