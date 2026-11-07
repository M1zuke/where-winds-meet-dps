import { describe, expect, it } from "vitest"
import { SET_FOUR_PIECE_TEXTS } from "../../src/data/sets/fourPieceTexts"
import { GEAR_SET_DEFS } from "../../src/definitions/sets/registry"

describe("set 4-piece texts", () => {
  it("has exactly one entry for every gear-group set", () => {
    expect(Object.keys(SET_FOUR_PIECE_TEXTS).sort()).toEqual(
      GEAR_SET_DEFS.map((definition) => definition.id).sort(),
    )
  })
})
