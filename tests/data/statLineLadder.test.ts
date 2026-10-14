import { describe, expect, it } from "vitest"
import { GEAR_WORD_IDS, GEAR_WORD_MAX_ROLL } from "../../src/data/stats/statLines"
import { GEAR_LEVELS } from "../../src/engine/types"

describe("gear word ceilings — the level-86-through-105 ladder", () => {
  it.each(GEAR_WORD_IDS)("%s never decreases from one storable level to the next", (word) => {
    const rolledLevels = GEAR_LEVELS.filter(
      (level) => GEAR_WORD_MAX_ROLL[word][level] !== undefined,
    )
    for (let index = 1; index < rolledLevels.length; index++) {
      const previous = GEAR_WORD_MAX_ROLL[word][rolledLevels[index - 1]!]!
      const current = GEAR_WORD_MAX_ROLL[word][rolledLevels[index]!]!
      expect(current).toBeGreaterThanOrEqual(previous)
    }
  })

  it("Max HP's ceiling is 2084, 2426, 2960, 3444 and 4010 from level 86 to 105", () => {
    expect(GEAR_LEVELS.map((level) => GEAR_WORD_MAX_ROLL.maxHp[level])).toEqual([
      2084, 2426, 2960, 3444, 4010,
    ])
  })

  it("Constitution's and Defense's ceilings follow the attribute ladder from level 86 to 105", () => {
    for (const level of GEAR_LEVELS) {
      expect(GEAR_WORD_MAX_ROLL.body[level]).toBe(GEAR_WORD_MAX_ROLL.power[level])
      expect(GEAR_WORD_MAX_ROLL.defense[level]).toBe(GEAR_WORD_MAX_ROLL.power[level])
    }
  })

  it("Physical Defense's ceiling is 27.4, 32, 39, 45.4 and 52.8 from level 86 to 105", () => {
    expect(GEAR_LEVELS.map((level) => GEAR_WORD_MAX_ROLL.physDef[level])).toEqual([
      27.4, 32, 39, 45.4, 52.8,
    ])
  })

  it("Boost Vs. Player Units shares the boss boost's ceiling at every level", () => {
    for (const level of GEAR_LEVELS) {
      expect(GEAR_WORD_MAX_ROLL.damageVsPlayer[level]).toBe(GEAR_WORD_MAX_ROLL.damageVsBoss[level])
    }
  })

  it("a word missing from a level is absent, never interpolated to 0 or a neighbour's value", () => {
    expect(GEAR_WORD_MAX_ROLL.minFormless[86]).toBeUndefined()
    expect(GEAR_WORD_MAX_ROLL.minFormless[91]).toBeUndefined()
    expect(GEAR_WORD_MAX_ROLL.minFormless[96]).toBe(44.2)
  })
})
