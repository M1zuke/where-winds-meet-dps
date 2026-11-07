// Scoped to Bamboocut Draught's Boundvessel data shape; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { boundvessel } from "../../src/data/skills/bamboocut-draught/boundvessel"

const RAPID_SLASH_FRAMES = [47, 56, 65, 74, 83, 91, 100, 109, 118, 127, 135]
const LOOP_START_FRAME = 40.41
const LOOP_END_FRAME = 136.41

const slashes = boundvessel.hits.filter(
  (hit) => /^hit-(\d|10|11)$/.test(hit.id) && hit.id !== "hit-0",
)

describe("Boundvessel's rapid slashes", () => {
  it("are 11, spread across the hold's loop window", () => {
    expect(slashes.map((hit) => hit.frame)).toEqual(RAPID_SLASH_FRAMES)
    for (const frame of RAPID_SLASH_FRAMES) {
      expect(frame).toBeGreaterThan(LOOP_START_FRAME)
      expect(frame).toBeLessThan(LOOP_END_FRAME)
    }
  })

  it("all carry the same per-slash row, gated on Binge Points", () => {
    for (const slash of slashes) {
      expect(slash).toMatchObject({
        physMultiplier: 0.158668,
        attributeMultiplier: 0.238001,
        physFixed: 43.953,
        attributeFixed: 23.933,
      })
      expect(slash.conditions).toEqual(slashes[0]!.conditions)
    }
  })

  it("finish on frame 161 and drain Endurance from frame 40", () => {
    expect(boundvessel.hits.find((hit) => hit.id === "hit-13")!.frame).toBe(161)
    expect(boundvessel.meterDrains).toEqual([
      expect.objectContaining({ perSecond: 15, fromFrame: 40, stopAfterSec: 1.6 }),
    ])
    expect(boundvessel.castFrames).toBe(208)
  })
})
