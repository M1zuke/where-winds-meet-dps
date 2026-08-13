// Ticks on ONE unbroken 1-second grid anchored at the first application, not a
// fresh grid per re-application — docs/CALCULATION.md § "Mechanic rules". Locks
// against a per-window phase reset.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"

describe("bleed-tick cadence — bellstrikeUmbra default rotation", () => {
  const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
  const bleedTicks = result
    .timeline!.filter((ev) => ev.kind === "dot" && ev.skillName.includes("Bleed Tick"))
    .map((ev) => ev.frame)
    .sort((a, b) => a - b)

  it("fires roughly one tick per second the rotation runs", () => {
    expect(bleedTicks.length).toBeGreaterThanOrEqual(0.8 * Math.floor(result.rotationDuration))
  })

  it("ticks on a uniform 60-frame grid within each continuously-maintained episode", () => {
    for (let i = 1; i < bleedTicks.length; i++) {
      const gap = bleedTicks[i] - bleedTicks[i - 1]
      expect(gap % 60).toBe(0)
    }
  })

  it("Bleed Tick (DoT) contributes a materially higher damage share than the old per-window scheduling", () => {
    const dotRow = result.perSkill.find((p) => p.name === "Bleed Tick (DoT)")
    expect(dotRow).toBeTruthy()
    expect(dotRow!.percentOfTotal).toBeGreaterThan(0.07)
  })
})
