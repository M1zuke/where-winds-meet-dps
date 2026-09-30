import { describe, expect, it } from "vitest"
import {
  DEFAULT_AVERAGE_FPS,
  DEFAULT_PING_MS,
  isValidAverageFps,
  isValidPingMs,
  resolveAverageFps,
  resolvePingMs,
} from "../../src/engine/pingFps"
import { makeRotation } from "../../src/engine/rotation"
import { defineRotation } from "../../src/definitions/rotations/rotationDef"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"

describe("the ping/fps defaults every rotation of every class starts from", () => {
  it("are 10 ms and 250 fps", () => {
    expect(DEFAULT_PING_MS).toBe(10)
    expect(DEFAULT_AVERAGE_FPS).toBe(250)
  })

  it("are what makeRotation fills in for a rotation with no ping/fps of its own", () => {
    const rotation = makeRotation("bellstrikeUmbra")
    expect(rotation.pingMs).toBe(10)
    expect(rotation.averageFps).toBe(250)
  })

  it("are what defineRotation fills in for a built-in rotation with no ping/fps of its own", () => {
    const rotation = defineRotation({
      id: "test-rotation",
      name: "Test",
      classId: "bellstrikeUmbra",
      steps: [],
      permanentBuffIds: [],
      createdAt: "",
      updatedAt: "",
    })
    expect(rotation.pingMs).toBe(10)
    expect(rotation.averageFps).toBe(250)
  })

  it("are what every built-in rotation resolves to through the registry", () => {
    const builtins = builtinRotationsForClass("bellstrikeUmbra")
    expect(builtins.length).toBeGreaterThan(0)
    for (const rotation of builtins) {
      expect(rotation.pingMs).toBe(10)
      expect(rotation.averageFps).toBe(250)
    }
  })
})

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
