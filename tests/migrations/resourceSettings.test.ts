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
      gains: { directHit: 7, qHit: 25, heavyLightCast: 25, chargedHit: 0, tier6: 25 },
      exhaustedGainPerTick: 4,
    })
  })
})
