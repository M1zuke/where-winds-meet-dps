// The acceptance anchor for Stonesplit Strength: a captured build, asserted
// exactly. A change that moves either number has changed the engine's answer,
// not just its shape.
import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import profileFile from "../migrations/testProfiles/v10/stonesplitStrength.json"

describe("Stonesplit Strength — the captured build", () => {
  // The default Qi break is the simulated schedule rather than the
  // rotation's own fixed clock window, so this pin moves with the target's
  // simulated Qi bar (docs/TIMELINE.md § "Qi bar").
  it("holds its measured dps and total damage", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(profile.inputs))))
    expect(result.dps).toBe(58971.8168715071)
    expect(result.totalDamage).toBe(3538309.012290426)
  })

  it("takes the board's last segment once the build reaches breakthrough 17", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const raised = { ...profile.inputs, breakthrough: 17 }
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(raised))))
    expect(result.dps).toBe(59887.50145763614)
    expect(result.totalDamage).toBe(3593250.0874581686)
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
