import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import profileFile from "./bamboocutDraughtMeasured.profile.json"

const MEASURED_ONE_MINUTE_TOTAL_MEAN = 4152000

describe("Bamboocut Draught — the measured build", () => {
  // Re-baselined once: the default Qi break is now the simulated schedule
  // rather than the rotation's own fixed clock window, moving the exhausted
  // window's own start by a couple of seconds (docs/TIMELINE.md § "Qi bar").
  it("holds its dps and total damage exactly", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
    expect(result.dps).toBe(67405.64204872282)
    expect(result.totalDamage).toBe(4053325.9418631988)
  })

  it.fails(
    "lands within two percent of the mean of four in-game one-minute runs from 2026-09-10",
    () => {
      const profile = importProfile(JSON.stringify(profileFile))
      const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
      expect(result.totalDamage / MEASURED_ONE_MINUTE_TOTAL_MEAN).toBeGreaterThan(0.98)
      expect(result.totalDamage / MEASURED_ONE_MINUTE_TOTAL_MEAN).toBeLessThan(1.02)
    },
  )

  it("plays the built-in dummy rotation on the four slotted inner ways", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    expect(profile.inputs.dummyMode).toBe(true)
    expect(profile.inputs.mindMethods.map((slot) => slot.id)).toEqual([
      "eonpour",
      "skyspeak",
      "mistwing",
      "moraleChant",
    ])
  })
})
