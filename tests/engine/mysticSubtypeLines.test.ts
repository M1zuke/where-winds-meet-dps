import { describe, expect, it } from "vitest"
import { buildContext } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearLevel, Inputs } from "../../src/engine/types"
import { gearWordPoolRetune, gearWordRelayedToLevel } from "../../src/data/stats/gearWordPools"
import { gearWordMaxRoll } from "../../src/data/stats/statLines"
import { AFFIX_ID_TO_STAT_LINE } from "../../src/ui/features/gear/import-gear-dialog/affixStatLineTable"

const SUBTYPE_WORDS = [
  "areaDebuffMysticBoost",
  "areaDamageMysticBoost",
  "singleTargetControlMysticBoost",
  "singleTargetBurstMysticBoost",
] as const

function boostsFor(overrides: Partial<Inputs>) {
  return buildContext({ ...defaultInputs, ...overrides }).mysticTypeBoosts ?? {}
}

describe("the four mystic subtype lines", () => {
  it("raise only the mystics of their own subtype", () => {
    expect(boostsFor({ controlMysticBoost: 0.05 })).toMatchObject({
      control: 0.05,
      burst: 0,
      area: 0,
      "area-debuff": 0,
      "area-damage": 0,
    })
    expect(boostsFor({ burstMysticBoost: 0.05 })).toMatchObject({ control: 0, burst: 0.05 })
    expect(boostsFor({ areaDebuffMysticBoost: 0.05 })).toMatchObject({
      "area-debuff": 0.05,
      "area-damage": 0,
    })
    expect(boostsFor({ areaDamageMysticBoost: 0.05 })).toMatchObject({
      "area-damage": 0.05,
      "area-debuff": 0,
    })
  })

  it("add to the merged words a stored piece may still hold", () => {
    expect(boostsFor({ singleMysticBoost: 0.03, burstMysticBoost: 0.05 })).toMatchObject({
      control: 0.03,
      burst: 0.08,
    })
    expect(boostsFor({ areaMysticBoost: 0.03, areaDebuffMysticBoost: 0.05 })).toMatchObject({
      "area-debuff": 0.08,
      "area-damage": 0.03,
    })
  })

  it.each([86, 91] as GearLevel[])("are rolled by a level-%i helm and chestpiece", (level) => {
    for (const slot of ["helm", "armor"] as const) {
      const pool = gearWordPoolRetune(level, slot, null)
      for (const word of SUBTYPE_WORDS) expect(pool).toContain(word)
    }
  })

  it.each([96, 100, 105] as GearLevel[])("are not rolled at level %i", (level) => {
    for (const word of SUBTYPE_WORDS) {
      expect(gearWordPoolRetune(level, "helm", null)).not.toContain(word)
    }
  })

  it("share the 86 and 91 ceilings", () => {
    for (const word of SUBTYPE_WORDS) {
      expect(gearWordMaxRoll(word, 86)).toBeCloseTo(0.07)
      expect(gearWordMaxRoll(word, 91)).toBeCloseTo(0.08)
    }
  })

  it("relay into the merged words at 96 and All Mystic from 100", () => {
    expect(gearWordRelayedToLevel("singleTargetControlMysticBoost", 91, 96)).toBe(
      "singleTargetMysticBoost",
    )
    expect(gearWordRelayedToLevel("areaDebuffMysticBoost", 86, 96)).toBe("areaMysticBoost")
    expect(gearWordRelayedToLevel("areaDamageMysticBoost", 91, 100)).toBe("allMysticBoost")
    expect(gearWordRelayedToLevel("singleTargetBurstMysticBoost", 86, 91)).toBe(
      "singleTargetBurstMysticBoost",
    )
  })

  it("keep a stored merged word when the piece stays at its level or is already at 100 or above", () => {
    expect(gearWordRelayedToLevel("areaMysticBoost", 91, 91)).toBe("areaMysticBoost")
    expect(gearWordRelayedToLevel("areaMysticBoost", 96, 96)).toBe("areaMysticBoost")
    expect(gearWordRelayedToLevel("areaMysticBoost", 96, 91)).toBe("areaDamageMysticBoost")
    expect(gearWordRelayedToLevel("singleTargetMysticBoost", 100, 105)).toBe(
      "singleTargetMysticBoost",
    )
  })

  it("are imported from their own affixes", () => {
    expect(AFFIX_ID_TO_STAT_LINE["8793031"]).toBe("word:areaDebuffMysticBoost")
    expect(AFFIX_ID_TO_STAT_LINE["9293030"]).toBe("word:areaDamageMysticBoost")
    expect(AFFIX_ID_TO_STAT_LINE["8794033"]).toBe("word:singleTargetControlMysticBoost")
    expect(AFFIX_ID_TO_STAT_LINE["9294032"]).toBe("word:singleTargetBurstMysticBoost")
    expect(AFFIX_ID_TO_STAT_LINE["9793122"]).toBe("word:areaMysticBoost")
  })
})
