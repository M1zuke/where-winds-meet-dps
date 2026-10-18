import { describe, expect, it } from "vitest"
import { parseBowItemId } from "../../src/ui/features/gear/import-gear-dialog/bowItemIds"
import {
  bowSetForSuffix,
  gearSetForSuffix,
} from "../../src/ui/features/gear/import-gear-dialog/gearSetSuffixes"

describe("bow item id parsing", () => {
  const tiers = [
    { tier: 15, level: 91 },
    { tier: 16, level: 96 },
    { tier: 17, level: 100 },
    { tier: 18, level: 105 },
  ] as const
  const stars = [
    { firstOffset: 37, rarity: "epic" },
    { firstOffset: 67, rarity: "legendary" },
  ] as const

  for (const { tier, level } of tiers) {
    for (const { firstOffset, rarity } of stars) {
      it(`reads tier ${tier} at offset ${firstOffset} as a ${level} ${rarity} ring and bows`, () => {
        const base = 1_100_000 + tier * 100
        expect(parseBowItemId(base + firstOffset)).toEqual({
          kind: "importable",
          part: "thumbRing",
          level,
          rarity,
        })
        for (const bowOffset of [1, 2, 3, 4]) {
          expect(parseBowItemId(base + firstOffset + bowOffset)).toEqual({
            kind: "importable",
            part: "bow",
            level,
            rarity,
          })
        }
      })
    }
  }

  it("leaves a three-star piece empty", () => {
    for (const offset of [7, 8, 9, 10, 11]) {
      expect(parseBowItemId(1_101_600 + offset)).toEqual({ kind: "carriesNoBowSet" })
    }
  })

  it("leaves a level 86 piece empty", () => {
    expect(parseBowItemId(1_101_467)).toEqual({ kind: "carriesNoBowSet" })
    expect(parseBowItemId(1_101_437)).toEqual({ kind: "carriesNoBowSet" })
  })

  it("leaves an id outside the range or between the star bands empty", () => {
    expect(parseBowItemId(1_101_399)).toEqual({ kind: "carriesNoBowSet" })
    expect(parseBowItemId(1_101_900)).toEqual({ kind: "carriesNoBowSet" })
    expect(parseBowItemId(1_101_612)).toEqual({ kind: "carriesNoBowSet" })
    expect(parseBowItemId(1_101_672)).toEqual({ kind: "carriesNoBowSet" })
    expect(parseBowItemId(null)).toEqual({ kind: "carriesNoBowSet" })
  })
})

describe("set suffix tables", () => {
  it("maps the gear set suffixes and nothing else", () => {
    expect(gearSetForSuffix(3)).toBe("hawkwing")
    expect(gearSetForSuffix(79)).toBe("tiltrim")
    expect(gearSetForSuffix(4)).toBeNull()
    expect(gearSetForSuffix(46)).toBeNull()
    expect(gearSetForSuffix(null)).toBeNull()
  })

  it("maps the bow set suffixes and nothing else", () => {
    expect(bowSetForSuffix(44)).toBe("precision")
    expect(bowSetForSuffix(45)).toBe("crit")
    expect(bowSetForSuffix(46)).toBe("affinity")
    expect(bowSetForSuffix(3)).toBeNull()
    expect(bowSetForSuffix(null)).toBeNull()
  })
})
