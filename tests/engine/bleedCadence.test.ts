// Ticks on ONE unbroken 1-second grid anchored at the first application, not a
// fresh grid per re-application — docs/CALCULATION.md § "Mechanic rules". Locks
// against a per-window phase reset.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { dotRow } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"
const BLEED_ROW = dotRow(CLASS, DEBUFF.bleedTick)

describe("bleed-tick cadence — bellstrikeUmbra default rotation", () => {
  const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
  const bleedTicks = result
    .timeline!.filter((ev) => ev.kind === "dot" && ev.skillName === BLEED_ROW)
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

  it("Bleeding (DoT) contributes a materially higher damage share than the old per-window scheduling", () => {
    const dotRow = result.perSkill.find((p) => p.name === BLEED_ROW)
    expect(dotRow).toBeTruthy()
    expect(dotRow!.percentOfTotal).toBeGreaterThan(0.07)
  })
})
