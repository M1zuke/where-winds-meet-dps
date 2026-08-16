// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { computeSkillDamage, type FormulaContext } from "../../src/engine/formula"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet, buildContext } from "../../src/engine/panel"
import { mulberry32, RUN_SEED_STRIDE } from "../../src/engine/rng"
import { SET_ID } from "../../src/data/sets/ids"
import type { Inputs } from "../../src/engine/types"

const umbra: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function engineInputs(variant: Inputs = umbra): Inputs {
  return applyBowSet(applyArmorSet(withDerivedStats(variant)))
}

const procFree = engineInputs({ ...umbra, set: null, mindMethods: defaultInputs.mindMethods })
const withProcs = engineInputs({ ...umbra, set: SET_ID.hawking })

function sampled(inputs: Inputs, seed: number) {
  return runEngine(inputs, { seed, collect: "totals" })
}

function context(): FormulaContext {
  return buildContext(procFree)
}

const FLAT_ART = {
  name: "probe",
  physMultiplier: 1,
  attributeMultiplier: 1,
  skillType: "weapon",
}

describe("a sampled engine run", () => {
  it("leaves the deterministic result byte-identical when no seed is given", () => {
    const first = runEngine(procFree)
    const second = runEngine(procFree)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(first.outcomeCounts).toBeUndefined()
    expect(first.expectedOutcomeShare).toBeUndefined()
  })

  it("preserves totalDamage and dps exactly when detail collection is off", () => {
    const full = runEngine(procFree, { seed: 11 })
    const totalsOnly = runEngine(procFree, { seed: 11, collect: "totals" })
    expect(totalsOnly.totalDamage).toBe(full.totalDamage)
    expect(totalsOnly.dps).toBe(full.dps)
    expect(totalsOnly.outcomeCounts).toEqual(full.outcomeCounts)
  })

  it("drops the timeline, casts and buff windows it was told not to collect", () => {
    const totalsOnly = runEngine(procFree, { seed: 3, collect: "totals" })
    expect(totalsOnly.timeline).toEqual([])
    expect(totalsOnly.casts).toEqual([])
    expect(totalsOnly.buffWindows).toEqual([])
    expect(totalsOnly.perSkill).toEqual([])
  })

  it("same seed produces an identical run", () => {
    expect(sampled(procFree, 4242).totalDamage).toBe(sampled(procFree, 4242).totalDamage)
    expect(sampled(procFree, 4242).outcomeCounts).toEqual(sampled(procFree, 4242).outcomeCounts)
  })

  it("different seeds produce different totals", () => {
    expect(sampled(procFree, 1).totalDamage).not.toBe(sampled(procFree, 2).totalDamage)
  })

  it("counts every damage event exactly once across the four outcome tallies", () => {
    const result = runEngine(procFree, { seed: 77 })
    const counts = result.outcomeCounts!
    const tallied = counts.abrasion + counts.normal + counts.crit + counts.affinity
    const events = (result.timeline ?? []).filter((entry) => entry.inWindow).length
    expect(tallied).toBe(events)
  })

  it("mean of sampled runs converges to the deterministic total for a build with no proc mechanics", () => {
    const expected = runEngine(procFree).totalDamage
    const runs = 2000
    let sum = 0
    for (let index = 0; index < runs; index++) {
      sum += sampled(procFree, (index * RUN_SEED_STRIDE) | 0).totalDamage
    }
    expect(Math.abs(sum / runs - expected) / expected).toBeLessThan(0.01)
  }, 30000)

  it("mean of sampled runs tracks the deterministic total within 5% when proc mechanics round an expectation", () => {
    const expected = runEngine(withProcs).totalDamage
    const runs = 400
    let sum = 0
    for (let index = 0; index < runs; index++) {
      sum += sampled(withProcs, (index * RUN_SEED_STRIDE) | 0).totalDamage
    }
    expect(Math.abs(sum / runs - expected) / expected).toBeLessThan(0.05)
  })
})

describe("a sampled hit", () => {
  it("pins abrasion to the minimum roll and affinity to the maximum", () => {
    const ctx = context()
    const cells = computeSkillDamage(FLAT_ART, ctx, 1).cells
    const tail = (1 + cells.H) * (cells.I || 1) * (1 + cells.E)
    const abrasion = computeSkillDamage(FLAT_ART, ctx, 1, () => 0).rolled!
    expect(abrasion.outcome).toBe("abrasion")
    expect(abrasion.damage).toBeCloseTo(cells.DZ * tail, 6)

    const affinityDraw = cells.AL + cells.AN + cells.AP / 2
    const affinity = computeSkillDamage(FLAT_ART, ctx, 1, () => affinityDraw).rolled!
    expect(affinity.outcome).toBe("affinity")
    expect(affinity.damage).toBeCloseTo(cells.ED * tail, 6)
  })

  it("rolls a normal hit uniformly between normalMin and normalMax", () => {
    const ctx = context()
    const cells = computeSkillDamage(FLAT_ART, ctx, 1).cells
    const tail = (1 + cells.H) * (cells.I || 1) * (1 + cells.E)
    const normalDraw = 1 - 1e-9

    const draws = [normalDraw, 0]
    const low = computeSkillDamage(FLAT_ART, ctx, 1, () => draws.shift() ?? 0).rolled!
    expect(low.outcome).toBe("normal")
    expect(low.damage).toBeCloseTo(cells.normalMin * tail, 6)

    const highDraws = [normalDraw, 1 - 1e-12]
    const high = computeSkillDamage(FLAT_ART, ctx, 1, () => highDraws.shift() ?? 0).rolled!
    expect(high.damage).toBeCloseTo(cells.normalMax * tail, 4)
  })

  it("weights the four outcomes by the chances it reports", () => {
    const ctx = context()
    const rng = mulberry32(9001)
    const seen = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const samples = 40000
    let chance = computeSkillDamage(FLAT_ART, ctx, 1, () => 0).rolled!.chance
    for (let index = 0; index < samples; index++) {
      const rolled = computeSkillDamage(FLAT_ART, ctx, 1, rng).rolled!
      seen[rolled.outcome] += 1
      chance = rolled.chance
    }
    expect(seen.crit / samples).toBeCloseTo(chance.crit, 2)
    expect(seen.affinity / samples).toBeCloseTo(chance.affinity, 2)
    expect(seen.abrasion / samples).toBeCloseTo(chance.abrasion, 2)
  })

  it("honours guaranteedNormal and guaranteedCrit in a sampled roll", () => {
    const ctx = context()
    const normal = computeSkillDamage({ ...FLAT_ART, guaranteedNormal: 1 }, ctx, 1, () => 0.99)
    expect(normal.rolled!.outcome).toBe("normal")
    expect(normal.rolled!.chance.normal).toBe(1)

    const crit = computeSkillDamage({ ...FLAT_ART, guaranteedCrit: 1 }, ctx, 1, () => 0)
    expect(crit.rolled!.outcome).toBe("crit")
    expect(crit.rolled!.chance.crit).toBe(1)
  })

  it("treats a conditional final crit promotion as a guaranteed crit when sampling", () => {
    const ctx = context()
    const art = {
      ...FLAT_ART,
      conditionalFinalCrit: { threshold: 0, bonusBelowThreshold: 0 },
    }
    const rolled = computeSkillDamage(art, ctx, 1, () => 0).rolled!
    expect(rolled.outcome).toBe("crit")
    expect(rolled.chance.crit).toBe(1)
  })

  it("never draws abrasion when precision is guaranteed", () => {
    const ctx = context()
    const rolled = computeSkillDamage(
      { ...FLAT_ART, guaranteedPrecision: 1 },
      ctx,
      1,
      () => 0,
    ).rolled!
    expect(rolled.outcome).not.toBe("abrasion")
    expect(rolled.chance.abrasion).toBe(0)
  })

  it("always draws the normal track for a Heavenwork row", () => {
    const ctx = context()
    const rolled = computeSkillDamage(
      { ...FLAT_ART, skillType: "Heavenwork" },
      ctx,
      1,
      () => 0,
    ).rolled!
    expect(rolled.outcome).toBe("normal")
    expect(rolled.chance.normal).toBe(1)
  })

  it("reports the same expected damage whether or not it also rolled", () => {
    const ctx = context()
    const plain = computeSkillDamage(FLAT_ART, ctx, 1)
    const rolling = computeSkillDamage(FLAT_ART, ctx, 1, () => 0.5)
    expect(rolling.expectedDamage).toBe(plain.expectedDamage)
  })
})
