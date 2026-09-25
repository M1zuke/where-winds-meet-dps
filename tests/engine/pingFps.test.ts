import { describe, expect, it } from "vitest"
import {
  DEFAULT_AVERAGE_FPS,
  DEFAULT_PING_MS,
  hasValidPingAndFps,
  isValidAverageFps,
  isValidPingMs,
  resolveAverageFps,
  resolvePingMs,
} from "../../src/engine/pingFps"

describe("isValidPingMs / isValidAverageFps", () => {
  it("accepts a whole ping within range and rejects one outside it or fractional", () => {
    expect(isValidPingMs(0)).toBe(true)
    expect(isValidPingMs(1000)).toBe(true)
    expect(isValidPingMs(-1)).toBe(false)
    expect(isValidPingMs(1001)).toBe(false)
    expect(isValidPingMs(50.5)).toBe(false)
  })

  it("accepts an average fps within range and rejects one outside it", () => {
    expect(isValidAverageFps(10)).toBe(true)
    expect(isValidAverageFps(360)).toBe(true)
    expect(isValidAverageFps(9.9)).toBe(false)
    expect(isValidAverageFps(360.1)).toBe(false)
  })
})

describe("hasValidPingAndFps — the shared required-input gate", () => {
  it("is false while either value is null", () => {
    expect(hasValidPingAndFps(null, null)).toBe(false)
    expect(hasValidPingAndFps(50, null)).toBe(false)
    expect(hasValidPingAndFps(null, 60)).toBe(false)
  })

  it("is false while a set value is out of range", () => {
    expect(hasValidPingAndFps(-1, 60)).toBe(false)
    expect(hasValidPingAndFps(50, 5)).toBe(false)
  })

  it("is true once both are set to a value in range", () => {
    expect(hasValidPingAndFps(50, 60)).toBe(true)
  })
})

describe("resolvePingMs / resolveAverageFps — what the engine reads while unset", () => {
  it("falls back to the default for null", () => {
    expect(resolvePingMs(null)).toBe(DEFAULT_PING_MS)
    expect(resolveAverageFps(null)).toBe(DEFAULT_AVERAGE_FPS)
  })

  it("passes a valid stored value through unchanged", () => {
    expect(resolvePingMs(80)).toBe(80)
    expect(resolveAverageFps(144)).toBe(144)
  })

  it("falls back to the default for an out-of-range stored value", () => {
    expect(resolvePingMs(-5)).toBe(DEFAULT_PING_MS)
    expect(resolveAverageFps(1)).toBe(DEFAULT_AVERAGE_FPS)
  })
})
