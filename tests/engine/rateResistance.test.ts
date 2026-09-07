import { describe, expect, it } from "vitest"
import { effectiveRates, resistanceForBreakthrough } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"

describe("resistanceForBreakthrough — bracket presets", () => {
  it("maps each breakthrough to the in-game percent", () => {
    expect(resistanceForBreakthrough(13)).toBe(30)
    expect(resistanceForBreakthrough(13)).toBe(30)
    expect(resistanceForBreakthrough(14)).toBe(45)
    expect(resistanceForBreakthrough(15)).toBe(45)
    expect(resistanceForBreakthrough(16)).toBe(65)
    expect(resistanceForBreakthrough(17)).toBe(65)
    expect(resistanceForBreakthrough(18)).toBe(85)
    expect(resistanceForBreakthrough(19)).toBe(85)
    expect(resistanceForBreakthrough(20)).toBe(115)
    expect(resistanceForBreakthrough(21)).toBe(115)
  })
})

describe("effectiveRates — precision soft-cap formula", () => {
  // (white − 0.65) / (1 + r) + 0.65
  it("100 % white at 30 % resistance → 91.92 % effective (breakthrough 13 → Lv. 86-90)", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 13, precision: 1.0 })
    expect(eff.precision).toBeCloseTo(0.9192, 3)
  })
  it("110.5 % white at 30 % resistance → 100 % effective (locked fixture)", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 13, precision: 1.105 })
    expect(eff.precision).toBeCloseTo(1.0, 6)
  })
  it("65 % white → 65 % effective at every breakthrough (the cap)", () => {
    for (const breakthrough of [13, 14, 15, 16, 17, 18, 19, 20, 21]) {
      const eff = effectiveRates({ ...defaultInputs, breakthrough, precision: 0.65 })
      expect(eff.precision).toBeCloseTo(0.65, 6)
    }
  })
  it("below the 65 % cap, precision is symmetrically pulled toward the cap", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 16, precision: 0.5 })
    expect(eff.precision).toBeCloseTo(0.5591, 3)
  })
})

describe("effectiveRates — crit / affinity divide-by-(1+r)", () => {
  it("locked fixture (breakthrough 13 → 30 % resistance) → 70 % crit, 16.4 % affinity", () => {
    const eff = effectiveRates(defaultInputs)
    expect(eff.critRate).toBeCloseTo(0.7, 6)
    expect(eff.affinityRate).toBeCloseTo(0.164, 6)
  })
  it("breakthrough 13 (30 % resistance): white / 1.3", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 13 })
    expect(eff.critRate).toBeCloseTo(defaultInputs.critRate / 1.3, 6)
  })
  it("breakthrough 16 (65 % resistance): white / 1.65", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 16 })
    expect(eff.critRate).toBeCloseTo(0.91 / 1.65, 6)
  })
  it("breakthrough 20 (115 % resistance, over 100 %): white / 2.15", () => {
    const eff = effectiveRates({ ...defaultInputs, breakthrough: 20 })
    expect(eff.critRate).toBeCloseTo(defaultInputs.critRate / 2.15, 6)
  })
})

describe("effectiveRates — resistance follows the breakthrough", () => {
  it("changing breakthrough across brackets DOES change effective rates", () => {
    const a = effectiveRates({ ...defaultInputs, breakthrough: 13 })
    const b = effectiveRates({ ...defaultInputs, breakthrough: 20 })
    expect(a.critRate).not.toBeCloseTo(b.critRate, 3)
  })
  it("changing breakthrough within the same bracket leaves effective rates the same", () => {
    const a = effectiveRates({ ...defaultInputs, breakthrough: 14 })
    const b = effectiveRates({ ...defaultInputs, breakthrough: 15 })
    expect(a.precision).toBeCloseTo(b.precision, 6)
    expect(a.critRate).toBeCloseTo(b.critRate, 6)
    expect(a.affinityRate).toBeCloseTo(b.affinityRate, 6)
  })
})
