// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  BREAKTHROUGH_TIERS,
  breakthroughAttributes,
  getBreakthrough,
} from "../../src/definitions/baseStats/breakthroughs"
import { getConfiguredBase, playerAttributes } from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { Inputs } from "../../src/engine/types"

const SELECTABLE = BREAKTHROUGH_TIERS.map((tier) => tier.breakthrough)

function attributeValue(breakthrough: number, stat: string): number {
  return breakthroughAttributes(breakthrough).find((entry) => entry.stat === stat)?.value ?? 0
}

function atBreakthrough(breakthrough: number): Inputs {
  return { ...defaultInputs, breakthrough }
}

describe("breakthrough drives the player's base attributes", () => {
  it("reads a different attribute row for every measured tier", () => {
    const rows = [14, 15, 16, 17].map((breakthrough) => playerAttributes(breakthrough).power)
    expect(new Set(rows).size).toBe(rows.length)
  })

  it("moves the derived base when only the breakthrough changes", () => {
    const lower = getConfiguredBase(atBreakthrough(14), [])
    const higher = getConfiguredBase(atBreakthrough(17), [])
    expect(higher["phys.min"]).toBeGreaterThan(lower["phys.min"])
    expect(higher["phys.max"]).toBeGreaterThan(lower["phys.max"])
    expect(higher.precision).toBeGreaterThan(lower.precision)
    expect(higher.critRate).toBeGreaterThan(lower.critRate)
    expect(higher.affinityRate).toBeGreaterThan(lower.affinityRate)
  })

  it("carries the change through to a full set of engine inputs", () => {
    const lower = withDerivedStats(atBreakthrough(14))
    const higher = withDerivedStats(atBreakthrough(17))
    expect(higher.phys.min).toBeGreaterThan(lower.phys.min)
    expect(higher.precision).toBeGreaterThan(lower.precision)
  })

  it("shifts each attribute by exactly the difference between the two tiers' rows", () => {
    for (const stat of ["power", "agility", "momentum"] as const) {
      const rowDelta = attributeValue(17, stat) - attributeValue(15, stat)
      const derivedDelta = playerAttributes(17)[stat] - playerAttributes(15)[stat]
      expect(derivedDelta).toBeCloseTo(rowDelta, 10)
    }
  })

  it("adds gear attributes on top of the tier's row rather than replacing it", () => {
    expect(playerAttributes(16).power).toBeGreaterThan(attributeValue(16, "power"))
  })
})

describe("tiers with no measured attribute row", () => {
  it("resolves every selectable tier without throwing", () => {
    for (const breakthrough of SELECTABLE) {
      expect(() => getBreakthrough(breakthrough)).not.toThrow()
      expect(breakthroughAttributes(breakthrough).length).toBeGreaterThan(0)
    }
  })

  it("clamps a tier below the measured range up to the lowest measured tier", () => {
    for (const breakthrough of [12, 13]) {
      expect(breakthroughAttributes(breakthrough)).toEqual(breakthroughAttributes(14))
    }
  })

  it("clamps a tier above the measured range down to the highest measured tier", () => {
    for (const breakthrough of [18, 19, 20, 21]) {
      expect(breakthroughAttributes(breakthrough)).toEqual(breakthroughAttributes(17))
    }
  })

  it("never reports weaker attributes for a higher breakthrough", () => {
    for (const [index, breakthrough] of SELECTABLE.slice(1).entries()) {
      const previous = playerAttributes(SELECTABLE[index])
      const current = playerAttributes(breakthrough)
      expect(current.power).toBeGreaterThanOrEqual(previous.power)
      expect(current.agility).toBeGreaterThanOrEqual(previous.agility)
      expect(current.momentum).toBeGreaterThanOrEqual(previous.momentum)
    }
  })
})

describe("the merged tier table", () => {
  it("keeps the target-side columns for every selectable tier", () => {
    for (const tier of BREAKTHROUGH_TIERS) {
      expect(tier.defense).toBeGreaterThan(0)
      expect(tier.multiplier).toBeGreaterThan(0)
      expect(typeof tier.resistance).toBe("number")
      expect(typeof tier.levelRange).toBe("string")
    }
  })

  it("is sorted ascending, which the clamp relies on for its bounds", () => {
    expect(SELECTABLE).toEqual([...SELECTABLE].sort((left, right) => left - right))
  })

  it("still resolves breakthrough 16 to the row the anchor profiles were recorded against", () => {
    // The tier-16 row the pre-coupling engine hardcoded; every validated anchor
    // profile sits at breakthrough 16.
    expect(attributeValue(16, "power")).toBe(138)
    expect(attributeValue(16, "agility")).toBe(138)
    expect(attributeValue(16, "momentum")).toBe(138)
    expect(attributeValue(16, "precisionRate")).toBe(0.153)
  })
})
