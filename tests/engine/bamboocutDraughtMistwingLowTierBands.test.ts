// Scoped to Bamboocut Draught's Mistwing target-health-penetration bands
// below tier 6 (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { mistwingLowTierTargetHealthPenetration } from "../../src/data/innerWays/mistwingBuffs"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"

function contextAt(tier: number, remainingHealthFraction: number, inebriate = false) {
  return {
    self: { reachesEvent: true },
    status: {
      isActive: (id: string) => inebriate && id === STATUS.inebriateDeepdaze,
      stacks: () => (inebriate ? 100 : 0),
    },
    build: { paramTier: () => tier },
    target: { remainingHealthFraction },
  } as never
}

function effectsOf(tier: number, remainingHealthFraction: number, inebriate = false) {
  const effects = mistwingLowTierTargetHealthPenetration.effects
  if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
  return effects(contextAt(tier, remainingHealthFraction, inebriate))
}

describe("Mistwing's tiers 1-5 target-health bands", () => {
  it("adds nothing above 80% health", () => {
    expect(effectsOf(1, 0.81)).toEqual([])
  })

  it("is physical-only at tier 1, stepping by 20% down to 20%", () => {
    expect(effectsOf(1, 0.7)).toEqual([{ kind: "stat", statKey: "phys.penetration", amount: 0.01 }])
    expect(effectsOf(1, 0.1)).toEqual([{ kind: "stat", statKey: "phys.penetration", amount: 0.04 }])
  })

  it("doubles in Inebriate from tier 3, still physical-only", () => {
    expect(effectsOf(3, 0.7, true)).toEqual([
      { kind: "stat", statKey: "phys.penetration", amount: 0.02 },
    ])
  })

  it("reaches both penetration types from tier 4", () => {
    expect(effectsOf(4, 0.7)).toEqual([
      { kind: "stat", statKey: "phys.penetration", amount: 0.01 },
      { kind: "stat", statKey: "bamboocut.penetration", amount: 0.01 },
    ])
  })

  it("is superseded outright by tier 6's own bands, not added to them", () => {
    expect(effectsOf(6, 0.5)).toEqual([])
  })
})
