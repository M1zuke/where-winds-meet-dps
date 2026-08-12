// The acceptance anchor for the Stonesplit Strength port: a captured build whose
// figures were measured before the class moved onto the define* factories. Both
// numbers are exact — a change that moves either one has changed the engine's
// answer, not just its shape.
import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import profileFile from "../migrations/testProfiles/v10/stonesplitStrength.json"

describe("Stonesplit Strength — the captured build", () => {
  it("holds its measured dps and total damage", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
    expect(result.dps).toBe(58263.5282178477)
    expect(result.totalDamage).toBe(3466679.9289619382)
  })

  it("reads the rotation and the four inner ways the profile stored", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    expect(profile.inputs.selectedBuiltinRotationId).toBe(
      "builtin-stonesplitStrength-windsfromcn-switch-no-toad",
    )
    expect(profile.inputs.mindMethods.map((slot) => slot.id)).toEqual([
      "frostCladNight",
      "moraleChant",
      "steadfastDevotion",
      "throatPierce",
    ])
  })
})
