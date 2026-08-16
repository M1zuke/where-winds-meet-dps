// Calls the exported compute functions directly — never spins up a real
// `Worker` in vitest/jsdom.
import { describe, expect, it } from "vitest"
import {
  computeGearAnalysisRequest,
  computeParseSimulation,
  computeRankingRequest,
  computeRotationDps,
  computeSetTiles,
  PARSE_RUN_CAP,
  type ParseSimulationWorkerRequest,
} from "../../src/engine/dpsWorker"
import { RUN_SEED_STRIDE } from "../../src/engine/rng"
import { computeGearAnalysis } from "../../src/engine/gearAnalysis"
import { builtinRotationsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { computeRanking } from "../../src/engine/itemRanking"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet, ARMOR_SET_OPTIONS, swapArsenal } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function dpsFor(variant = umbraInputs) {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(variant)))).dps
}

describe("computeRankingRequest", () => {
  it("matches computeRanking(inputs, baselineDps) for the same inputs", () => {
    const baselineDps = runEngine(umbraInputs).dps
    const expected = computeRanking(umbraInputs, baselineDps)
    const res = computeRankingRequest({ reqId: 1, inputs: umbraInputs, baselineDps })
    expect(res.rows).toEqual(expected)
  })

  it("echoes reqId", () => {
    const baselineDps = runEngine(umbraInputs).dps
    const res = computeRankingRequest({ reqId: 42, inputs: umbraInputs, baselineDps })
    expect(res.reqId).toBe(42)
  })
})

describe("computeGearAnalysisRequest", () => {
  it("matches computeGearAnalysis(inputs, baselineDps) for the same inputs", () => {
    const baselineDps = runEngine(umbraInputs).dps
    const expected = computeGearAnalysis(umbraInputs, baselineDps)
    const res = computeGearAnalysisRequest({ reqId: 1, inputs: umbraInputs, baselineDps })
    expect(res.rows).toEqual(expected)
  })

  it("echoes reqId", () => {
    const baselineDps = runEngine(umbraInputs).dps
    const res = computeGearAnalysisRequest({ reqId: 42, inputs: umbraInputs, baselineDps })
    expect(res.reqId).toBe(42)
  })
})

describe("computeSetTiles", () => {
  const res = computeSetTiles({ reqId: 7, inputs: umbraInputs })

  it("echoes reqId", () => {
    expect(res.reqId).toBe(7)
  })

  it("armorDpsByKey.__none matches the reference set:null pipeline", () => {
    const expected = dpsFor({ ...umbraInputs, set: null })
    expect(res.armorDpsByKey.__none).toBe(expected)
  })

  it("armorDpsByKey matches the reference pipeline for a real setKey", () => {
    const opt = ARMOR_SET_OPTIONS[0]
    const expected = dpsFor({ ...umbraInputs, set: opt.setKey })
    expect(res.armorDpsByKey[opt.setKey]).toBe(expected)
  })

  it("bowDpsByChoice matches the reference pipeline for all four choices", () => {
    expect(res.bowDpsByChoice.affinity).toBe(dpsFor({ ...umbraInputs, bowSet: "affinity" }))
    expect(res.bowDpsByChoice.crit).toBe(dpsFor({ ...umbraInputs, bowSet: "crit" }))
    expect(res.bowDpsByChoice.precision).toBe(dpsFor({ ...umbraInputs, bowSet: "precision" }))
    expect(res.bowDpsByChoice.none).toBe(dpsFor({ ...umbraInputs, bowSet: null }))
  })

  it("arsenalDpsByChoice matches the reference pipeline for two choices", () => {
    expect(res.arsenalDpsByChoice.general).toBe(dpsFor(swapArsenal(umbraInputs, "general")))
    expect(res.arsenalDpsByChoice.bellstrike).toBe(dpsFor(swapArsenal(umbraInputs, "bellstrike")))
  })
})

describe("computeRotationDps", () => {
  const builtins = builtinRotationsForClass("bellstrikeUmbra")
  const options = builtins.map((rotation) => ({ optionId: rotation.id, rotation }))

  it("echoes reqId", () => {
    expect(computeRotationDps({ reqId: 5, inputs: umbraInputs, options }).reqId).toBe(5)
  })

  it("matches runEngine with that rotation active, for every option", () => {
    const res = computeRotationDps({ reqId: 1, inputs: umbraInputs, options })

    for (const { optionId, rotation } of options) {
      const expected = runEngine({ ...umbraInputs, activeCustomRotation: rotation }).dps
      expect(res.dpsByOptionId[optionId]).toBe(expected)
    }
  })

  it("agrees with the selected-built-in path the app uses", () => {
    const builtin = builtins[0]
    const res = computeRotationDps({
      reqId: 2,
      inputs: umbraInputs,
      options: [{ optionId: builtin.id, rotation: builtin }],
    })
    const viaSelection = runEngine({
      ...umbraInputs,
      activeCustomRotation: null,
      selectedBuiltinRotationId: builtin.id,
    }).dps

    expect(res.dpsByOptionId[builtin.id]).toBe(viaSelection)
  })

  it("treats a null rotation as the class default", () => {
    const res = computeRotationDps({
      reqId: 3,
      inputs: umbraInputs,
      options: [
        { optionId: "axis", rotation: null },
        { optionId: "default", rotation: defaultRotationForClass("bellstrikeUmbra") },
      ],
    })

    expect(res.dpsByOptionId.axis).toBe(res.dpsByOptionId.default)
  })

  it("ignores whatever rotation the incoming inputs already carried", () => {
    const builtin = builtins[0]
    const other = builtins[builtins.length - 1]
    const withOtherActive = { ...umbraInputs, activeCustomRotation: other }
    const res = computeRotationDps({
      reqId: 4,
      inputs: withOtherActive,
      options: [{ optionId: builtin.id, rotation: builtin }],
    })

    expect(res.dpsByOptionId[builtin.id]).toBe(
      runEngine({ ...umbraInputs, activeCustomRotation: builtin }).dps,
    )
  })
})

describe("computeParseSimulation", () => {
  const rotation = defaultRotationForClass("bellstrikeUmbra")
  const seed = 20260816

  function request(overrides: Partial<ParseSimulationWorkerRequest> = {}) {
    return { reqId: 1, inputs: umbraInputs, rotation, runs: 6, seed, ...overrides }
  }

  it("echoes reqId", async () => {
    expect((await computeParseSimulation(request({ reqId: 91 }))).reqId).toBe(91)
  })

  it("matches a direct runEngine loop over the same seeds", async () => {
    const res = await computeParseSimulation(request())
    const runInputs = {
      ...umbraInputs,
      activeCustomRotation: rotation,
      selectedBuiltinRotationId: null,
    }

    expect(res.runs).toHaveLength(6)
    res.runs.forEach((run, index) => {
      const expected = runEngine(runInputs, {
        seed: (seed + index * RUN_SEED_STRIDE) | 0,
        collect: "totals",
      })
      expect(run.totalDamage).toBe(expected.totalDamage)
      expect(run.dps).toBe(expected.dps)
      expect(run.criticalHits).toBe(expected.outcomeCounts!.crit)
      expect(run.affinityHits).toBe(expected.outcomeCounts!.affinity)
      expect(run.abrasionHits).toBe(expected.outcomeCounts!.abrasion)
      expect(run.normalHits).toBe(expected.outcomeCounts!.normal)
    })
  })

  it("decorrelates consecutive run seeds", async () => {
    const res = await computeParseSimulation(request({ runs: 20 }))
    const totals = new Set(res.runs.map((run) => run.totalDamage))
    expect(totals.size).toBe(20)
  })

  it("caps the run count", async () => {
    const res = await computeParseSimulation(
      request({ runs: PARSE_RUN_CAP + 500 }),
      undefined,
      () => true,
    )
    expect(res.requestedRuns).toBe(PARSE_RUN_CAP)
  })

  it("reports progress once per chunk and ends at total", async () => {
    const seen: { done: number; total: number }[] = []
    const res = await computeParseSimulation(request({ runs: 12 }), (done, total) =>
      seen.push({ done, total }),
    )
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((entry) => entry.total === 12)).toBe(true)
    expect(seen[seen.length - 1].done).toBe(12)
    expect(res.cancelled).toBe(false)
    expect(res.completedRuns).toBe(12)
  })

  it("stops early when cancelled and keeps the runs it completed", async () => {
    const res = await computeParseSimulation(request({ runs: 500 }), undefined, () => true)
    expect(res.cancelled).toBe(true)
    expect(res.completedRuns).toBeLessThan(500)
    expect(res.runs).toHaveLength(res.completedRuns)
    expect(res.completedRuns).toBeGreaterThan(0)
  })

  it("reports the expected outcome rates the runs were drawn against", async () => {
    const res = await computeParseSimulation(request({ runs: 4 }))
    const rates = res.expectedRates!
    const sum = rates.abrasion + rates.normal + rates.crit + rates.affinity
    expect(sum).toBeCloseTo(1, 6)
  })
})
