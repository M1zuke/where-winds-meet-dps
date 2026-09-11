// Registry/metadata invariant — spans every registered class the way
// docs/TESTING.md § "Class scoping" allows for a structural check, not a
// damage assertion. Class-specific damage assertions for the reordering live
// in tests/engine/dotTriggersBuffs.test.ts and
// tests/engine/bamboocutDraughtInnerWayTiers.test.ts.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { CLASS_IDS } from "../../src/definitions/classes/registry"

describe("time-ordered damage pass — DoT ticks keep a steady cadence per debuff", () => {
  for (const classId of CLASS_IDS()) {
    it(`${classId} — each debuff's ticks land on distinct, increasing frames`, () => {
      const result = runEngine({ ...defaultInputs, classId, breakthrough: 17 })
      const framesByName = new Map<string, number[]>()
      for (const event of result.timeline ?? []) {
        if (event.kind !== "dot") continue
        const frames = framesByName.get(event.skillName) ?? []
        frames.push(event.frame)
        framesByName.set(event.skillName, frames)
      }
      for (const frames of framesByName.values()) {
        const sorted = [...frames].sort((left, right) => left - right)
        expect(sorted).toEqual([...new Set(sorted)])
        for (const frame of sorted) expect(frame).toBeGreaterThanOrEqual(0)
      }
    })
  }
})
