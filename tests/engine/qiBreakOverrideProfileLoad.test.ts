// A stored `qiBreakOverride` is a legacy field only — docs/MIGRATIONS.md.
// It survives the load and reload round trip, but the engine no longer reads
// it: the simulated Qi bar runs identically with or without it.
import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"

function profileFileWith(qiBreakOverride: unknown) {
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

describe("a stored Qi break override no longer changes what the engine runs", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the field through import, but scores identically with or without it", () => {
    const override = { startSec: 30, durationSec: 12, lowQiLeadSec: 3 }
    const imported = importProfile(JSON.stringify(profileFileWith(override)))
    expect(
      (imported.inputs.combatSettings as unknown as { qiBreakOverride: unknown }).qiBreakOverride,
    ).toEqual(override)

    const { qiBreakOverride: _dropped, ...rest } = imported.inputs
      .combatSettings as unknown as Record<string, unknown>
    const withoutOverride: Inputs = {
      ...imported.inputs,
      combatSettings: rest as unknown as Inputs["combatSettings"],
    }

    const withOverride = runEngine(engineInputsFrom(imported.inputs))
    const withoutOverrideResult = runEngine(engineInputsFrom(withoutOverride))
    expect(withOverride.totalDamage).toBeCloseTo(withoutOverrideResult.totalDamage, 9)
  })

  it("re-saving and reloading a profile with the field leaves its numbers unchanged", () => {
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

  it("every run iterates the simulated Qi bar — no single-pass manual mode exists", () => {
    const override = { startSec: 30, durationSec: 12, lowQiLeadSec: 3 }
    const imported = importProfile(JSON.stringify(profileFileWith(override)))
    const result = runEngine(engineInputsFrom(imported.inputs))
    expect(result.qiIterations).toBeGreaterThanOrEqual(2)
  })
})
