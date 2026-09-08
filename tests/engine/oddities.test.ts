import { describe, expect, it } from "vitest"
import {
  oddityContributions,
  DEFAULT_ODDITIES,
  getConfiguredBase,
  oddityHpTotal,
  oddityPhysDefTotal,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import { ODDITIES } from "../../src/data/baseStats/oddities"
import type { Inputs, OddityRegions } from "../../src/engine/types"

function rawTotals(): { min: number; max: number } {
  let min = 0
  let max = 0
  for (const entries of Object.values(ODDITIES)) {
    for (const node of entries) {
      if (node.stat === "minPhys") min += node.value
      if (node.stat === "maxPhys") max += node.value
    }
  }
  return { min, max }
}

describe("editable oddities", () => {
  it("oddityContributions(DEFAULT_ODDITIES) sums phys.min/phys.max to the raw JSON totals", () => {
    const out = oddityContributions(DEFAULT_ODDITIES)
    const raw = rawTotals()
    expect(out["phys.min"]).toBeCloseTo(raw.min, 6)
    expect(out["phys.max"]).toBeCloseTo(raw.max, 6)
  })

  it("disabled nodes contribute 0", () => {
    const region = Object.keys(DEFAULT_ODDITIES)[0]
    const disabled: OddityRegions = {
      ...DEFAULT_ODDITIES,
      [region]: DEFAULT_ODDITIES[region].map((n) => ({ ...n, enabled: false })),
    }
    const out = oddityContributions(disabled)
    const raw = rawTotals()
    const zeroedMin = DEFAULT_ODDITIES[region]
      .filter((n) => n.stat === "minPhys")
      .reduce((s, n) => s + n.value, 0)
    const zeroedMax = DEFAULT_ODDITIES[region]
      .filter((n) => n.stat === "maxPhys")
      .reduce((s, n) => s + n.value, 0)
    expect(out["phys.min"] ?? 0).toBeCloseTo(raw.min - zeroedMin, 6)
    expect(out["phys.max"] ?? 0).toBeCloseTo(raw.max - zeroedMax, 6)
  })

  it("fully-disabled table contributes nothing", () => {
    const disabledAll: OddityRegions = {}
    for (const [region, nodes] of Object.entries(DEFAULT_ODDITIES)) {
      disabledAll[region] = nodes.map((n) => ({ ...n, enabled: false }))
    }
    const out = oddityContributions(disabledAll)
    expect(out["phys.min"] ?? 0).toBe(0)
    expect(out["phys.max"] ?? 0).toBe(0)
  })

  it("getConfiguredBase seeds DEFAULT_ODDITIES when inputs.oddities is absent — value-preserving", () => {
    const legacy = { ...defaultInputs } as Partial<Inputs>
    delete legacy.oddities
    const withoutField = getConfiguredBase(legacy as Inputs, [])
    const withField = getConfiguredBase({ ...defaultInputs, oddities: DEFAULT_ODDITIES }, [])
    expect(withoutField["phys.min"]).toBeCloseTo(withField["phys.min"], 6)
    expect(withoutField["phys.max"]).toBeCloseTo(withField["phys.max"], 6)
  })

  it("sums every region's Max HP nodes to 8150", () => {
    expect(oddityHpTotal(DEFAULT_ODDITIES)).toBe(8150)
  })

  it("sums every region's Physical Defense nodes to 50", () => {
    expect(oddityPhysDefTotal(DEFAULT_ODDITIES)).toBe(50)
  })

  it("leaves the attack-node total at 124, unchanged by adding the HP and defense nodes", () => {
    const raw = rawTotals()
    expect(raw.min + raw.max).toBe(124)
  })

  it("keeps Max HP and Physical Defense nodes off the combat base, unlike the attack nodes", () => {
    const out = oddityContributions(DEFAULT_ODDITIES)
    expect(out.maxHp).toBeUndefined()
    expect(out.physDef).toBeUndefined()
  })

  it("toggling a node's enabled flag lowers the base by exactly that node's value", () => {
    const region = Object.keys(DEFAULT_ODDITIES)[0]
    const node = DEFAULT_ODDITIES[region][0]
    const inputs: Inputs = { ...defaultInputs, oddities: DEFAULT_ODDITIES }
    const toggledOff: OddityRegions = {
      ...DEFAULT_ODDITIES,
      [region]: DEFAULT_ODDITIES[region].map((n) =>
        n.id === node.id ? { ...n, enabled: false } : n,
      ),
    }
    const before = getConfiguredBase(inputs, [])
    const after = getConfiguredBase({ ...inputs, oddities: toggledOff }, [])
    const path = node.stat === "minPhys" ? "phys.min" : "phys.max"
    expect(before[path] - after[path]).toBeCloseTo(node.value, 6)
  })
})
