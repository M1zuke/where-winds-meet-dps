// The acceptance anchor for Stonesplit Strength: a captured build, asserted
// exactly. A change that moves either number has changed the engine's answer,
// not just its shape. Re-baselined for the Cleftpeak 4-piece correction: 5.1s
// (not 5), a stacking ×(1 + 1%/stack) ramp multiplied with a separate ×1.08 at
// five stacks (not a flat +5% always-on plus an additive +8% at max stacks).
// Re-baselined again, in the last floating-point place only: the engine now
// sums every damage event into the total in one time-ordered pass, which
// reorders the same floating-point additions.
// Re-baselined again: the Exhausted (Qi-break) bonus now multiplies outside
// the additive boost bracket instead of folding into it, raising every hit
// and tick inside the break window.
// Re-baselined again: the stored Fire Oil setting now also applies its Burn
// DoT, not just its flat damage bonus.
// Re-baselined again: the talent board follows the profile's breakthrough, and
// this build stands at 16, so the nodes behind Solo Mode Level 17 no longer
// count towards it.
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
    expect(result.dps).toBe(62550.02134472498)
    expect(result.totalDamage).toBe(3721726.2700111363)
  })

  it("takes the board's last segment once the build reaches breakthrough 17", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const raised = { ...profile.inputs, breakthrough: 17 }
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(raised))))
    expect(result.dps).toBe(63463.3522162738)
    expect(result.totalDamage).toBe(3776069.4568682914)
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
