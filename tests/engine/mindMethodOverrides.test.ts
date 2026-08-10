// Only Insightful Strike drives a per-art override now — the rules for
// Mud-Fish Heart, Sutra Shift, Boat on Wood and Forgotten River Echo went with
// those inner ways when the 23 unimplemented ones were removed (2026-08-10),
// and the whole boost-zone table went with them.
import { describe, expect, it } from "vitest"
import { resolveMindMethodOverrides } from "../../src/engine/mindMethodOverrides"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

function withInnerWays(...slots: { id: string; stacks: string }[]): Inputs {
  const empty = { name: "", stacks: "" }
  return {
    ...defaultInputs,
    mindMethods: [
      slots[0] ?? empty,
      slots[1] ?? empty,
      slots[2] ?? empty,
      slots[3] ?? empty,
    ] as Inputs["mindMethods"],
  }
}

describe("Insightful Strike affects Nine Sword/Nine Spear affinity damage", () => {
  it("selected → +0.10 affinity damage; affinity-rate conditional removed", () => {
    const o = resolveMindMethodOverrides(
      withInnerWays({ id: "insightfulStrike", stacks: "tier 6" }),
    )
    expect(o.artsOverrides["Nine Sword Q"].extraAffinityDamage).toBeCloseTo(0.1, 6)
    expect(o.artsOverrides["Nine Sword Q"].extraAffinityRate).toBeUndefined()
    expect(o.artsOverrides["Nine Spear Q (1st)"].extraAffinityDamage).toBeCloseTo(0.1, 6)
  })

  it("not selected → 0 affinity damage, no affinity-rate field", () => {
    const o = resolveMindMethodOverrides(withInnerWays())
    expect(o.artsOverrides["Nine Sword Q"].extraAffinityDamage).toBe(0)
    expect(o.artsOverrides["Nine Sword Q"].extraAffinityRate).toBeUndefined()
  })

  // A slot saved before ids existed carries only the display name.
  it("resolves a slot that still identifies itself by display name", () => {
    const o = resolveMindMethodOverrides({
      ...defaultInputs,
      mindMethods: [
        { name: "Insightful Strike", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ] as Inputs["mindMethods"],
    })
    expect(o.artsOverrides["Nine Sword Q"].extraAffinityDamage).toBeCloseTo(0.1, 6)
  })
})

describe("the boost-zone channel carries nothing", () => {
  it("is empty — every rule referenced a removed inner way", () => {
    expect(resolveMindMethodOverrides(withInnerWays()).boostZoneOverrides).toEqual({})
  })
})
