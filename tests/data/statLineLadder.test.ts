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

  it("a word missing from a level is absent, never interpolated to 0 or a neighbour's value", () => {
    expect(GEAR_WORD_MAX_ROLL.minFormless[86]).toBeUndefined()
    expect(GEAR_WORD_MAX_ROLL.minFormless[91]).toBeUndefined()
    expect(GEAR_WORD_MAX_ROLL.minFormless[96]).toBe(44.2)
  })
})
