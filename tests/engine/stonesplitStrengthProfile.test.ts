// The acceptance anchor for Stonesplit Strength: a captured build, asserted
// exactly. A change that moves either number has changed the engine's answer,
// not just its shape.
import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"
import profileFile from "../migrations/testProfiles/v10/stonesplitStrength.json"

function withoutBoardsAddedLater(inputs: Inputs): Inputs {
  return {
    ...inputs,
    unclaimedOddityNodes: { ...inputs.unclaimedOddityNodes, Qingzhou: [600], Jiangnan: [700] },
  }
}

describe("Stonesplit Strength — the captured build", () => {
  it("holds its measured dps and total damage", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(
      applyBowSet(applyArmorSet(withDerivedStats(withoutBoardsAddedLater(profile.inputs)))),
    )
    expect(result.dps).toBe(58974.77644878697)
    expect(result.totalDamage).toBe(3538486.5869272184)
  })

  it("takes the board's last segment once the build reaches breakthrough 17", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const raised = { ...withoutBoardsAddedLater(profile.inputs), breakthrough: 17 }
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(raised))))
    expect(result.dps).toBe(59987.41317958918)
    expect(result.totalDamage).toBe(3599244.7907753508)
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
