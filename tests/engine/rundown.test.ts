import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

describe("rundown — perSkill percent invariant", () => {
  it("Σ perSkill.percentOfTotal ≈ 1 for a real rotation run", () => {
    const r = runEngine(umbraInputs)
    const sum = r.perSkill.reduce((s, p) => s + p.percentOfTotal, 0)
    expect(sum).toBeCloseTo(1, 6)
  })

  it("Σ perSkill.expectedDamage === totalDamage still holds", () => {
    const r = runEngine(umbraInputs)
    const sum = r.perSkill.reduce((s, p) => s + p.expectedDamage, 0)
    expect(sum).toBeCloseTo(r.totalDamage, 6)
  })
})

describe("rundown — timeline event log", () => {
  it("is non-empty and frame-ordered", () => {
    const r = runEngine(umbraInputs)
    expect(r.timeline).toBeDefined()
    expect(r.timeline!.length).toBeGreaterThan(0)
    for (let i = 1; i < r.timeline!.length; i++) {
      expect(r.timeline![i].frame).toBeGreaterThanOrEqual(r.timeline![i - 1].frame)
    }
  })
})

describe("rundown — per-skill cast fields", () => {
  it("every perSkill row has castCount >= 0", () => {
    const r = runEngine(umbraInputs)
    for (const row of r.perSkill) {
      expect(row.castCount ?? 0).toBeGreaterThanOrEqual(0)
    }
  })

  it("every buffWindows entry has endSec >= startSec", () => {
    const r = runEngine(umbraInputs)
    expect(r.buffWindows).toBeDefined()
    for (const w of r.buffWindows!) {
      expect(w.endSec).toBeGreaterThanOrEqual(w.startSec)
    }
  })
})
