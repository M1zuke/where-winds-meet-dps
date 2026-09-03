import { describe, expect, it } from "vitest"
import {
  clampEnhancementValue,
  enhancementCap,
  enhancementContributions,
  DEFAULT_ENHANCEMENTS,
  getConfiguredBase,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import enhancementsJson from "../../src/data/baseStats/enhancements.json"
import { ENHANCEMENT_SLOTS } from "../../src/engine/types"
import type { Inputs } from "../../src/engine/types"

interface RawEnhancementEntry {
  id: number
  slot: string
  stat: string
  value: number
}

const rawEntries = (enhancementsJson as Record<string, RawEnhancementEntry[]>)["95"]

function rawTotals(): { min: number; max: number } {
  let min = 0
  let max = 0
  for (const entry of rawEntries) {
    if (entry.stat === "minPhys") min += entry.value
    if (entry.stat === "maxPhys") max += entry.value
  }
  return { min, max }
}

describe("editable enhancements", () => {
  it("files every entry under a slot the tab can render", () => {
    for (const node of DEFAULT_ENHANCEMENTS) {
      expect(ENHANCEMENT_SLOTS, `id ${node.id}`).toContain(node.slot)
    }
  })

  it("enhancementContributions(DEFAULT_ENHANCEMENTS) sums to the raw JSON totals", () => {
    const out = enhancementContributions(DEFAULT_ENHANCEMENTS)
    const raw = rawTotals()
    expect(out["phys.min"]).toBeCloseTo(raw.min, 6)
    expect(out["phys.max"]).toBeCloseTo(raw.max, 6)
  })

  it("getConfiguredBase seeds DEFAULT_ENHANCEMENTS when inputs.enhancements is absent", () => {
    const legacy = { ...defaultInputs } as Partial<Inputs>
    delete legacy.enhancements
    const withoutField = getConfiguredBase(legacy as Inputs, [])
    const withField = getConfiguredBase(
      { ...defaultInputs, enhancements: DEFAULT_ENHANCEMENTS },
      [],
    )
    expect(withoutField["phys.min"]).toBeCloseTo(withField["phys.min"], 6)
    expect(withoutField["phys.max"]).toBeCloseTo(withField["phys.max"], 6)
  })

  it("lowering one entry lowers the base by exactly that entry's value", () => {
    const node = DEFAULT_ENHANCEMENTS[0]
    const inputs: Inputs = { ...defaultInputs, enhancements: DEFAULT_ENHANCEMENTS }
    const zeroed = DEFAULT_ENHANCEMENTS.map((entry) =>
      entry.id === node.id ? { ...entry, value: 0 } : entry,
    )
    const before = getConfiguredBase(inputs, [])
    const after = getConfiguredBase({ ...inputs, enhancements: zeroed }, [])
    const path = node.stat === "minPhys" ? "phys.min" : "phys.max"
    expect(before[path] - after[path]).toBeCloseTo(node.value, 6)
  })

  it("caps a value at the figure enhancements.json authors and floors it at zero", () => {
    for (const node of DEFAULT_ENHANCEMENTS) {
      expect(enhancementCap(node.id)).toBe(node.value)
      expect(clampEnhancementValue(node.id, node.value + 1)).toBe(node.value)
      expect(clampEnhancementValue(node.id, node.value - 1)).toBe(node.value - 1)
      expect(clampEnhancementValue(node.id, -5)).toBe(0)
    }
  })

  it("leaves an id this build does not define exactly as stored", () => {
    const unknownId = Math.max(...DEFAULT_ENHANCEMENTS.map((node) => node.id)) + 1
    expect(enhancementCap(unknownId)).toBeUndefined()
    expect(clampEnhancementValue(unknownId, 9999)).toBe(9999)
  })
})
