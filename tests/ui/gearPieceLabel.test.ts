import { describe, expect, it } from "vitest"
import { sanitizeGearPieceText } from "../../src/storage"

describe("sanitizeGearPieceText", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeGearPieceText("  Retune slot 3  ", 40)).toBe("Retune slot 3")
  })

  it("stores a whitespace-only input as absent, not empty string", () => {
    expect(sanitizeGearPieceText("   ", 40)).toBeUndefined()
  })

  it("truncates a 41-character name to 40", () => {
    const input = "a".repeat(41)
    const result = sanitizeGearPieceText(input, 40)
    expect(result).toHaveLength(40)
    expect(result).toBe("a".repeat(40))
  })

  it("truncates a 501-character note to 500", () => {
    const input = "b".repeat(501)
    const result = sanitizeGearPieceText(input, 500)
    expect(result).toHaveLength(500)
    expect(result).toBe("b".repeat(500))
  })

  it.each([null, undefined, 42, { toString: () => "x" }])(
    "yields the absent value rather than throwing for %p",
    (value) => {
      expect(sanitizeGearPieceText(value, 40)).toBeUndefined()
    },
  )

  it("is idempotent across repeated calls", () => {
    const once = sanitizeGearPieceText("  Retune slot 3  ", 40)
    const twice = sanitizeGearPieceText(once, 40)
    expect(twice).toBe(once)
  })
})
