// docs/UI.md § "The rules", "warm-start" — every repeated sweep seeds its own
// iteration from the baseline's already-converged schedule.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { computeRanking } from "../../src/engine/itemRanking"
import { computeGearAnalysis } from "../../src/engine/gearAnalysis"
import {
  computeDpsDeltas,
  computeReattunement,
  computeRetunement,
  computeWordMax,
} from "../../src/engine/dpsWorker"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { graduationInputs } from "../../src/engine/graduation"
import { FPS } from "../../src/engine/timeline"
import { qiScheduleSeedBreaksFrom, warmStartQiSchedule } from "../../src/engine/qiBar"
import type { GearPiece } from "../../src/engine/types"

const CLASS_ID = "stonesplitStrength"

function gearedUmbraInputs() {
  const inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
  const weapon: GearPiece = {
    id: "weapon",
    slot: "leftWeapon",
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
    relayed: false,
  }
  return {
    piece: weapon,
    inputs: {
      ...inputs,
      inventory: [weapon],
      equipped: { ...inputs.equipped, leftWeapon: weapon.id },
    },
  }
}

function graduationInputsFor(classId: string) {
  const [build] = graduationBuildsFor(classId)
  return withDerivedStats(
    applyBowSet(
      applyArmorSet(
        graduationInputs({
          ...defaultInputs,
          classId,
          graduationBuildId: build.id,
          breakthrough: 17,
        })!,
      ),
    ),
  )
}

describe("warmStartQiSchedule", () => {
  it("reports broken exactly inside the seeded breaks and nowhere else", () => {
    const schedule = warmStartQiSchedule(
      [{ startFrame: 60, endFrame: 660, immuneUntilFrame: 660 }],
      FPS,
    )
    expect(schedule.isBroken(59 / FPS)).toBe(false)
    expect(schedule.isBroken(60 / FPS)).toBe(true)
    expect(schedule.isBroken(659 / FPS)).toBe(true)
    expect(schedule.isBroken(660 / FPS)).toBe(false)
  })
})

describe("qiScheduleSeedBreaksFrom", () => {
  it("converts seconds to frame breaks, is absent with no run, and empty for an unbroken one", () => {
    const seeded = qiScheduleSeedBreaksFrom([{ startSec: 1, endSec: 11 }], FPS)
    expect(seeded).toEqual([{ startFrame: 60, endFrame: 660, immuneUntilFrame: 660 }])
    expect(qiScheduleSeedBreaksFrom([], FPS)).toEqual([])
    expect(qiScheduleSeedBreaksFrom(undefined, FPS)).toBeUndefined()
  })
})

describe("a ranking sweep warm-started from the baseline's own schedule", () => {
  it("lands on the same expected DPS as an unseeded run", () => {
    const inputs = graduationInputsFor(CLASS_ID)
    const baseline = runEngine(inputs)
    const seeded = computeRanking(inputs, baseline.dps, {
      qiScheduleSeedBreaks: qiScheduleSeedBreaksFrom(baseline.qiBreaks, FPS),
    })
    const unseeded = computeRanking(inputs, baseline.dps)
    expect(seeded.map((row) => row.expectedDps)).toEqual(unseeded.map((row) => row.expectedDps))
  })

  it("converges in no more passes than seeding from the rotation's authored window", () => {
    const inputs = graduationInputsFor(CLASS_ID)
    const baseline = runEngine(inputs)
    const seededBreaks = qiScheduleSeedBreaksFrom(baseline.qiBreaks, FPS)
    // A single stat line's worth of extra damage — the small perturbation a
    // real ranking candidate applies.
    const perturbed = { ...inputs, allDamageBoost: (inputs.allDamageBoost ?? 0) + 0.02 }
    const warmStarted = runEngine(perturbed, { qiScheduleSeedBreaks: seededBreaks })
    const reseeded = runEngine(perturbed)
    expect(warmStarted.qiIterations ?? 0).toBeLessThanOrEqual(reseeded.qiIterations ?? 0)
  })
})

describe("every other repeated sweep warm-started from the baseline's own schedule", () => {
  it("gear analysis lands on the same rows as an unseeded run", () => {
    const { inputs } = gearedUmbraInputs()
    const baseline = runEngine(inputs)
    const seeded = computeGearAnalysis(inputs, baseline.dps, {
      qiScheduleSeedBreaks: qiScheduleSeedBreaksFrom(baseline.qiBreaks, FPS),
    })
    const unseeded = computeGearAnalysis(inputs, baseline.dps)
    expect(seeded).toEqual(unseeded)
  })

  it("dps deltas land on the same deltas as an unseeded run", () => {
    const { inputs, piece } = gearedUmbraInputs()
    const baseline = runEngine(inputs)
    const seeded = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps: baseline.dps,
      pieceIds: [piece.id],
      baselineQiBreaks: baseline.qiBreaks,
    })
    const unseeded = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps: baseline.dps,
      pieceIds: [piece.id],
    })
    expect(seeded.deltas).toEqual(unseeded.deltas)
  })

  it("retunement lands on the same rows as an unseeded run", () => {
    const { inputs, piece } = gearedUmbraInputs()
    const baseline = runEngine(inputs)
    const seeded = computeRetunement({
      reqId: 1,
      inputs,
      pieceId: piece.id,
      baselineQiBreaks: baseline.qiBreaks,
    })
    const unseeded = computeRetunement({ reqId: 1, inputs, pieceId: piece.id })
    expect(seeded.rows).toEqual(unseeded.rows)
  })

  it("reattunement lands on the same options as an unseeded run", () => {
    const { inputs, piece } = gearedUmbraInputs()
    const baseline = runEngine(inputs)
    const seeded = computeReattunement({
      reqId: 1,
      inputs,
      pieceId: piece.id,
      baselineQiBreaks: baseline.qiBreaks,
    })
    const unseeded = computeReattunement({ reqId: 1, inputs, pieceId: piece.id })
    expect(seeded.options).toEqual(unseeded.options)
  })

  it("word max lands on the same rows as an unseeded run", () => {
    const { inputs, piece } = gearedUmbraInputs()
    const baseline = runEngine(inputs)
    const seeded = computeWordMax({
      reqId: 1,
      inputs,
      piece,
      baselineQiBreaks: baseline.qiBreaks,
    })
    const unseeded = computeWordMax({ reqId: 1, inputs, piece })
    expect(seeded.rows).toEqual(unseeded.rows)
  })
})
