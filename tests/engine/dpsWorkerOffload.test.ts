// Calls the exported compute functions directly — never spins up a real
// `Worker` in vitest/jsdom.
import { describe, expect, it } from "vitest"
import {
  computeDpsDeltas,
  computeEquippedDeltas,
  computeGearAnalysisRequest,
  computeParseSimulation,
  computeProfileMetrics,
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
import { withCustomContent } from "../../src/engine/customContent"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { Skill } from "../../src/engine/skill"
import {
  applyArmorSet,
  applyBowSet,
  ARMOR_SET_OPTIONS,
  defaultArsenalForClass,
  swapArsenal,
} from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { GEAR_SLOTS } from "../../src/engine/types"
import type { GearPiece, Inputs } from "../../src/engine/types"

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

  it("arsenalDpsByChoice contains exactly general, the class default and the active choice", () => {
    const classDefault = defaultArsenalForClass(umbraInputs.classId)
    expect(Object.keys(res.arsenalDpsByChoice).sort()).toEqual(
      [...new Set(["general", classDefault, umbraInputs.arsenal])].sort(),
    )
  })

  it("arsenalDpsByChoice matches the reference pipeline for general and the class default", () => {
    const classDefault = defaultArsenalForClass(umbraInputs.classId)
    expect(res.arsenalDpsByChoice.general).toBe(dpsFor(swapArsenal(umbraInputs, "general")))
    expect(res.arsenalDpsByChoice[classDefault]).toBe(
      dpsFor(swapArsenal(umbraInputs, classDefault)),
    )
  })

  it("arsenalDpsByChoice matches the reference pipeline for the active off-attribute choice", () => {
    expect(defaultArsenalForClass(umbraInputs.classId)).not.toBe(umbraInputs.arsenal)
    expect(res.arsenalDpsByChoice[umbraInputs.arsenal]).toBe(
      dpsFor(swapArsenal(umbraInputs, umbraInputs.arsenal)),
    )
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

describe("computeProfileMetrics", () => {
  const profiles = [
    { id: "profile-a", inputs: umbraInputs },
    { id: "profile-b", inputs: { ...umbraInputs, dummyMode: !umbraInputs.dummyMode } },
    { id: "profile-c", inputs: { ...umbraInputs, set: null } },
  ]
  const noCustomContent = { customSkills: [], customBuffs: [], customDebuffs: [] }

  it("echoes reqId", () => {
    expect(computeProfileMetrics({ reqId: 9, profiles, ...noCustomContent }).reqId).toBe(9)
  })

  it("matches the app's configured baseline pipeline for every profile", () => {
    const res = computeProfileMetrics({ reqId: 1, profiles, ...noCustomContent })

    for (const { id, inputs } of profiles) {
      const configured = withCustomContent(inputs, [], [], [])
      const expected = runEngine(applyBowSet(applyArmorSet(withDerivedStats(configured))))
      expect(res.metricsByProfileId[id]).toEqual({
        dps: expected.dps,
        totalDamage: expected.totalDamage,
        rotationDuration: expected.rotationDuration,
      })
    }
  })

  it("leaves a profile untouched by custom content authored for another class", () => {
    const otherClassSkill: Skill = {
      id: "fictional-skill",
      classId: "fictionalClass",
      name: "Fictional Skill",
      skillType: "weapon",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      hits: [],
      castFrames: 0,
      triggerable: false,
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
    }
    const withOtherClassSkill = computeProfileMetrics({
      reqId: 1,
      profiles,
      customSkills: [otherClassSkill],
      customBuffs: [],
      customDebuffs: [],
    })
    const withoutCustomContent = computeProfileMetrics({ reqId: 1, profiles, ...noCustomContent })

    expect(withOtherClassSkill.metricsByProfileId).toEqual(withoutCustomContent.metricsByProfileId)
  })

  it("answers the same per profile subset as it does for the whole set", () => {
    const whole = computeProfileMetrics({ reqId: 1, profiles, ...noCustomContent })
    const shards = profiles.map(
      (profile) =>
        computeProfileMetrics({ reqId: 1, profiles: [profile], ...noCustomContent })
          .metricsByProfileId,
    )

    expect(Object.assign({}, ...shards)).toEqual(whole.metricsByProfileId)
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

describe("computeEquippedDeltas", () => {
  function gearPiece(id: string, slot: GearPiece["slot"]): GearPiece {
    return {
      id,
      slot,
      level: 91,
      rarity: "legendary",
      minPhys: 1000,
      maxPhys: 2000,
      hp: 0,
      physDef: 0,
      words: [
        { word: "crit", value: 0.03, retuned: false },
        { word: "power", value: 40, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "physPen",
      attunementValue: 0.03,
      relayed: true,
    }
  }

  const geared: Inputs = {
    ...umbraInputs,
    inventory: [
      gearPiece("worn-weapon", "leftWeapon"),
      gearPiece("worn-helm", "helm"),
      gearPiece("benched-helm", "helm"),
    ],
    equipped: { ...umbraInputs.equipped, leftWeapon: "worn-weapon", helm: "worn-helm" },
  }
  const baselineDps = runEngine(geared).dps

  it("echoes reqId", () => {
    expect(computeEquippedDeltas({ reqId: 5, inputs: geared, baselineDps }).reqId).toBe(5)
  })

  it("agrees with computeDpsDeltas on every piece it covers", () => {
    const equipped = computeEquippedDeltas({ reqId: 1, inputs: geared, baselineDps })
    const full = computeDpsDeltas({
      reqId: 1,
      inputs: geared,
      baselineDps,
      pieceIds: geared.inventory.map((piece) => piece.id),
    })

    for (const [pieceId, delta] of Object.entries(equipped.deltas)) {
      expect(delta).toEqual(full.deltas[pieceId])
    }
  })

  it("covers the equipped pieces and nothing on the bench", () => {
    const res = computeEquippedDeltas({ reqId: 1, inputs: geared, baselineDps })

    expect(Object.keys(res.deltas).sort()).toEqual(["worn-helm", "worn-weapon"])
  })

  it("skips a slot whose equipped id is no longer in the inventory", () => {
    const stale: Inputs = { ...geared, equipped: { ...geared.equipped, bracer: "deleted" } }

    expect(
      Object.keys(computeEquippedDeltas({ reqId: 1, inputs: stale, baselineDps }).deltas),
    ).not.toContain("deleted")
  })

  it("answers the same per slot as it does for every slot at once", () => {
    const whole = computeEquippedDeltas({ reqId: 1, inputs: geared, baselineDps })
    const perSlot = GEAR_SLOTS.map(
      (slot) =>
        computeEquippedDeltas({ reqId: 1, inputs: geared, baselineDps, slots: [slot] }).deltas,
    )

    expect(Object.assign({}, ...perSlot)).toEqual(whole.deltas)
  })
})

describe("computeDpsDeltas shard parity", () => {
  it("answers the same per piece-id subset as it does for the whole set", () => {
    const inputs = umbraInputs
    const baselineDps = runEngine(inputs).dps
    const pieceIds = inputs.inventory.map((piece) => piece.id)
    const whole = computeDpsDeltas({ reqId: 1, inputs, baselineDps, pieceIds })
    const shards = pieceIds.map(
      (pieceId) => computeDpsDeltas({ reqId: 1, inputs, baselineDps, pieceIds: [pieceId] }).deltas,
    )

    expect(Object.assign({}, ...shards)).toEqual(whole.deltas)
  })
})
