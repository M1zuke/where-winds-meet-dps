import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"

describe("additive saved resource settings", () => {
  it("keeps old profiles loadable without a resource field", () => {
    const profile = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: { ...defaultInputs, classId: "silkbindJade" },
      }),
    )
    expect(profile.inputs.resourceSettings).toBeUndefined()
  })
  it("preserves measured gains and repairs invalid balances on import", () => {
    const profile = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: {
          ...defaultInputs,
          classId: "silkbindJade",
          resourceSettings: {
            blossoms: {
              opening: 999,
              gains: { directHit: 7, chargedHit: -5, tier6: 25 },
              exhaustedGainPerTick: 4,
            },
          },
        },
      }),
    )
    expect(profile.inputs.resourceSettings?.blossoms).toEqual({
      opening: 100,
      gains: {
        launchCost: -10,
        directHit: 7,
        qHit: 20,
        heavyLightCast: 13,
        chargedHit: 0,
        chargedHitLift: 4,
        apricotHeavenHit: 8,
        bambooBreezeHit: 6,
        tier6: 25,
      },
      exhaustedGainPerTick: 4,
    })
  })

  it("keeps a negative resource cost through a save/load round trip", () => {
    const saved = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: {
          ...defaultInputs,
          classId: "silkbindJade",
          resourceSettings: {
            blossoms: { opening: 100, gains: { launchCost: -10 }, exhaustedGainPerTick: 3 },
          },
        },
      }),
    )
    const reloaded = importProfile(
      JSON.stringify({ id: "test", name: "Test", inputs: saved.inputs }),
    )
    expect(reloaded.inputs.resourceSettings?.blossoms.gains.launchCost).toBe(-10)
  })

  it("heals a Blossom gain still sitting at its old stale default to the corrected one", () => {
    const profile = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: {
          ...defaultInputs,
          classId: "silkbindJade",
          resourceSettings: {
            blossoms: {
              opening: 100,
              gains: { heavyLightCast: 45, chargedHit: 0 },
              exhaustedGainPerTick: 3,
            },
          },
        },
      }),
    )
    expect(profile.inputs.resourceSettings?.blossoms.gains.heavyLightCast).toBe(13)
    expect(profile.inputs.resourceSettings?.blossoms.gains.chargedHit).toBe(20.4)
  })

  it("leaves a Blossom gain the player deliberately set away from the old default alone", () => {
    const profile = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: {
          ...defaultInputs,
          classId: "silkbindJade",
          resourceSettings: {
            blossoms: { opening: 100, gains: { heavyLightCast: 99 }, exhaustedGainPerTick: 3 },
          },
        },
      }),
    )
    expect(profile.inputs.resourceSettings?.blossoms.gains.heavyLightCast).toBe(99)
  })

  it("clamps a gain no lower than its own negative default", () => {
    const profile = importProfile(
      JSON.stringify({
        id: "test",
        name: "Test",
        inputs: {
          ...defaultInputs,
          classId: "silkbindJade",
          resourceSettings: { blossoms: { gains: { launchCost: -50 } } },
        },
      }),
    )
    expect(profile.inputs.resourceSettings?.blossoms.gains.launchCost).toBe(-10)
  })
})
