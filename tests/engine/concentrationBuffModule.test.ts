// Pins the tier-5/tier-6 x display/damage x spec branching directly, with a
// plain context literal — no engine mock needed since EffectContext is
// read-only. Damage assertions scoped to Bellstrike Umbra/Splendor, the two
// specs Concentration is available on — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { concentration } from "../../src/data/skills/buffs/concentration"
import type { EffectContext } from "../../src/engine/effects/context"

function contextFor(overrides: {
  event: EffectContext["event"]
  paramTier: number
  spec: string | undefined
}): EffectContext {
  return {
    timeSec: 0,
    phase: "normal",
    build: {
      classId: "bellstrikeUmbra",
      spec: overrides.spec,
      armorSet: undefined,
      param: () => true,
      paramTier: () => overrides.paramTier,
      paramValue: () => 0,
    },
    target: { isTrainingDummy: false },
    status: {
      isActive: () => false,
      stacks: () => 0,
      appliedAt: () => null,
      expiresAt: () => null,
    },
    self: { stacks: 0 },
    event: overrides.event,
  }
}

describe("concentration buff module", () => {
  it("emits nothing on cast", () => {
    const ctx = contextFor({
      event: { kind: "cast", castTag: "x", props: {} },
      paramTier: 6,
      spec: "bellstrike_umbra",
    })
    expect(concentration.effects(ctx)).toEqual([])
  })

  it("display ignores the tier-6 pair, even at tier 6", () => {
    const ctx = contextFor({ event: { kind: "display" }, paramTier: 6, spec: "bellstrike_umbra" })
    expect(concentration.effects(ctx)).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.03 },
    ])
  })

  it("damage at tier 5 is the base pair only", () => {
    const ctx = contextFor({
      event: { kind: "damage", castTag: "x", tags: new Set() },
      paramTier: 5,
      spec: "bellstrike_umbra",
    })
    expect(concentration.effects(ctx)).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.03 },
    ])
  })

  it("damage at tier 6 for bellstrike_umbra appends sustainDamageBoost twice", () => {
    const ctx = contextFor({
      event: { kind: "damage", castTag: "x", tags: new Set() },
      paramTier: 6,
      spec: "bellstrike_umbra",
    })
    expect(concentration.effects(ctx)).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.03 },
      { kind: "stat", statKey: "sustainDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "sustainDamageBoost", amount: 0.1 },
    ])
  })

  it("damage at tier 6 with no spec set drops the tier-6 pair silently", () => {
    const ctx = contextFor({
      event: { kind: "damage", castTag: "x", tags: new Set() },
      paramTier: 6,
      spec: undefined,
    })
    expect(concentration.effects(ctx)).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.03 },
    ])
  })
})
