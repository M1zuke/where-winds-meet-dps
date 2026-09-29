// docs/MIGRATIONS.md — the Qi bar's mode is derived from `qiBreakOverride`,
// never stored as its own field: a saved profile with an explicit override
// and one with `null` both have to load and run unchanged.
import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"

function profileFileWith(
  qiBreakOverride: NonNullable<Inputs["combatSettings"]>["qiBreakOverride"],
) {
  return {
    v: 4,
    profile: {
      id: "p1",
      name: "Test",
      inputs: {
        ...defaultInputs,
        combatSettings: { ...defaultInputs.combatSettings, qiBreakOverride },
      },
    },
  }
}

function engineInputsFrom(inputs: Inputs) {
  return applyBowSet(applyArmorSet(withDerivedStats(inputs)))
}

describe("a stored profile with a Qi break override and one with null both load", () => {
  beforeEach(() => localStorage.clear())

  it("loads and runs with an explicit override, in manual (single-pass) mode", () => {
    const override = { startSec: 30, durationSec: 12, lowQiLeadSec: 3 }
    const imported = importProfile(JSON.stringify(profileFileWith(override)))
    expect(imported.inputs.combatSettings?.qiBreakOverride).toEqual(override)

    const result = runEngine(engineInputsFrom(imported.inputs))
    expect(Number.isFinite(result.dps)).toBe(true)
    expect(result.qiIterations).toBe(1)
  })

  it("loads and runs with `null`, in simulated mode", () => {
    const imported = importProfile(JSON.stringify(profileFileWith(null)))
    expect(imported.inputs.combatSettings?.qiBreakOverride).toBeNull()

    const result = runEngine(engineInputsFrom(imported.inputs))
    expect(Number.isFinite(result.dps)).toBe(true)
    expect(result.qiIterations).toBeGreaterThanOrEqual(1)
  })

  it("re-saving and reloading the override profile leaves its numbers unchanged", () => {
    const override = { startSec: 30, durationSec: 12, lowQiLeadSec: 3 }
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify({
        v: profileFileWith(override).v,
        profiles: [profileFileWith(override).profile],
        activeId: "p1",
      }),
    )
    const first = loadProfiles().profiles[0].inputs
    const before = runEngine(engineInputsFrom(first)).dps

    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify({
        v: profileFileWith(override).v,
        profiles: [loadProfiles().profiles[0]],
        activeId: "p1",
      }),
    )
    const second = loadProfiles().profiles[0].inputs
    const after = runEngine(engineInputsFrom(second)).dps

    expect(after).toBe(before)
  })
})
