// Ticks on ONE unbroken cadence carried from the first application, not a fresh
// one per re-application — docs/CALCULATION.md § "Mechanic rules". Locks against
// a per-window phase reset.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { effectiveTickIntervalFrames } from "../../src/engine/dot"
import { builtinDebuff, dotRow } from "../builtins"
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
    expect(bleedTicks.length).toBeGreaterThanOrEqual(0.75 * Math.floor(result.rotationDuration))
  })

  it("holds one cadence across a continuously-maintained episode, never restarting its phase", () => {
    const interval = effectiveTickIntervalFrames(builtinDebuff(CLASS, DEBUFF.bleedTick).dot!)
    for (let i = 1; i < bleedTicks.length; i++) {
      // A tick the stack count skips leaves a gap of several intervals; what
      // must never happen is a gap that is not a whole number of them.
      const gap = bleedTicks[i] - bleedTicks[i - 1]
      expect(Math.abs(gap - Math.round(gap / interval) * interval)).toBeLessThanOrEqual(1)
    }
  })

  it("Bleeding (DoT) contributes a materially higher damage share than the old per-window scheduling", () => {
    const dotRow = result.perSkill.find((p) => p.name === BLEED_ROW)
    expect(dotRow).toBeTruthy()
    expect(dotRow!.percentOfTotal).toBeGreaterThan(0.07)
  })
})
