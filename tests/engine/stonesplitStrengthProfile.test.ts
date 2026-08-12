import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import profileFile from "./testProfiles/stonesplitStrengthProfile.json"

describe("Stonesplit Strength — the captured build", () => {
  it("holds its measured dps and total damage", () => {
    void readFileSync
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
    console.log("DPS", result.dps, "TOTAL", result.totalDamage)
    expect(result.dps).toBeCloseTo(58263.53, 2)
    expect(result.totalDamage).toBeCloseTo(3466680, -1)
  })
})
