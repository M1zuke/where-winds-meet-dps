// Calls the exported compute functions directly — never spins up a real
// `Worker` in vitest/jsdom.
import { describe, expect, it } from "vitest"
import { computeRankingRequest, computeSetTiles } from "../../src/engine/dpsWorker"
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
