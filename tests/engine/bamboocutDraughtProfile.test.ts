import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"
import profileFile from "./bamboocutDraughtMeasured.profile.json"

function withoutBoardsAddedLater(inputs: Inputs): Inputs {
  return {
    ...inputs,
    unclaimedOddityNodes: { ...inputs.unclaimedOddityNodes, Qingzhou: [600], Jiangnan: [700] },
  }
}

const MEASURED_ONE_MINUTE_TOTAL_MEAN = 4152000

describe("Bamboocut Draught — the measured build", () => {
  it("holds its dps and total damage exactly", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(
      applyBowSet(applyArmorSet(withDerivedStats(withoutBoardsAddedLater(profile.inputs)))),
    )
    expect(result.dps).toBe(65958.0662467149)
    expect(result.totalDamage).toBe(4098194.516129219)
  })

  it("lands within two percent of the mean of four in-game one-minute runs from 2026-09-10", () => {
    const profile = importProfile(JSON.stringify(profileFile))
    const result = runEngine(
      applyBowSet(applyArmorSet(withDerivedStats(withoutBoardsAddedLater(profile.inputs)))),
    )
    expect(result.totalDamage / MEASURED_ONE_MINUTE_TOTAL_MEAN).toBeGreaterThan(0.98)
    expect(result.totalDamage / MEASURED_ONE_MINUTE_TOTAL_MEAN).toBeLessThan(1.02)
  })

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
