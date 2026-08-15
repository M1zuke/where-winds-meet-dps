import { describe, expect, it } from "vitest"
import { getFTPiece, ftDpsWhenEquipped } from "../../src/engine/fullPotential"
import { computeDpsDeltas } from "../../src/engine/dpsWorker"
import { runEngine } from "../../src/engine/dps"
import { applyPieceContribution, relayedCapValue } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { poolForClass } from "../../src/definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "../../src/engine/retunement"
import { defaultInputs } from "../../src/engine/defaults"

import type { GearPiece, Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function piece(words: GearPiece["words"], overrides: Partial<GearPiece> = {}): GearPiece {
  return {
    id: "ft-test",
    slot: "leftWeapon",
    level: 91,
    rarity: "legendary",
    minPhys: 1000,
    maxPhys: 2000,
    hp: 0,
    physDef: 0,
    words,
    attunement: "",
    attunementValue: 0,
    relayed: false,
    ...overrides,
  }
}

function w(
  word: GearPiece["words"][number]["word"],
  value = 0,
  retuned = false,
): GearPiece["words"][number] {
  return { word, value, retuned }
}
const EMPTY = w("", 0)

function withInventory(p: GearPiece, equipped: boolean = false, extra: GearPiece[] = []): Inputs {
  const inv: GearPiece[] = [p, ...extra]
  return {
    ...umbraInputs,
    inventory: inv,
    equipped: equipped ? { ...umbraInputs.equipped, [p.slot]: p.id } : umbraInputs.equipped,
  }
}

describe("getFTPiece", () => {
  it("for a non-relayed piece, returns the variant whose DPS is at least as high as either build path", () => {
    const p = piece([w("crit", 0.05), w("agility", 30), w("momentum", 30), EMPTY, EMPTY], {
      attunement: "physPen",
      attunementValue: 0.06,
    })
    const inputs = withInventory(p)
    const baselineDps = runEngine(inputs).dps
    const ft = getFTPiece(p, inputs)

    const baseline = applyPieceContribution(inputs, p, -1)
    const ftDps = runEngine(applyPieceContribution(baseline, ft, +1)).dps
    expect(ftDps).toBeGreaterThanOrEqual(baselineDps - 1e-6)
  })

  it("for a relayed piece, modulates word values to the 94 % cap and leaves retune flags untouched", () => {
    const p = piece([w("crit", 0.05), w("agility", 30), w("momentum", 30), EMPTY, EMPTY], {
      relayed: true,
      attunement: "physPen",
      attunementValue: 0.06,
    })
    const inputs = withInventory(p)
    runEngine(inputs)
    const ft = getFTPiece(p, inputs)

    expect(ft.relayed).toBe(true)
    const specs = getWordSpecs(inputs)
    for (let i = 0; i < 5; i++) {
      expect(ft.words[i].retuned).toBe(p.words[i].retuned)
      if (!ft.words[i].word) continue
      const spec = specs.find((s) => s.word === ft.words[i].word)
      const cap = spec ? relayedCapValue(spec.amount, spec.unit) : 0
      expect(ft.words[i].value).toBeCloseTo(cap, 6)
      const before = p.words.find((x) => x.word === ft.words[i].word)?.value ?? 0
      expect(ft.words[i].value).toBeGreaterThanOrEqual(before - 1e-9)
    }
  })

  it("applying the panel's top retune to the piece does not change FP (the picker already accounted for it)", () => {
    const p = piece(
      [w("crit", 0.05), w("agility", 20), w("momentum", 20), w("maxBamboocut", 5), EMPTY],
      { attunement: "physPen", attunementValue: 0.04 },
    )
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const fpBefore = ftDpsWhenEquipped(p, inputs) - baselineDps

    const baseline = applyPieceContribution(inputs, p, -1)
    let bestSwap: { slot: number; word: string; dps: number } | null = null
    const pool = poolForClass(inputs.classId)
    const specs = getWordSpecs(inputs)
    if (pool) {
      for (const slotIndex of rerollableSlots(p)) {
        const annotated = annotatePoolForSlot(p, slotIndex, pool)
        for (const { word, legal, isCurrent } of annotated) {
          if (!legal || isCurrent) continue
          const spec = specs.find((s) => s.word === word)
          if (!spec) continue
          const swappedWords = p.words.map((wd, i) =>
            i === slotIndex ? { word, value: spec.amount, retuned: true } : wd,
          ) as GearPiece["words"]
          const swapped: GearPiece = { ...p, words: swappedWords }
          const dps = runEngine(applyPieceContribution(baseline, swapped, +1)).dps
          if (!bestSwap || dps > bestSwap.dps) bestSwap = { slot: slotIndex, word, dps }
        }
      }
    }
    if (!bestSwap) throw new Error("test setup expected at least one legal swap")

    const spec = specs.find((s) => s.word === bestSwap!.word)!
    const pPost: GearPiece = {
      ...p,
      words: p.words.map((wd, i) =>
        i === bestSwap!.slot ? { word: bestSwap!.word, value: spec.amount, retuned: true } : wd,
      ) as GearPiece["words"],
    }
    const inputsPost: Inputs = {
      ...applyPieceContribution(applyPieceContribution(inputs, p, -1), pPost, +1),
      inventory: [pPost],
      equipped: { ...inputs.equipped, [pPost.slot]: pPost.id },
    }
    const baselinePostDps = runEngine(inputsPost).dps
    const fpAfter = ftDpsWhenEquipped(pPost, inputsPost) - baselinePostDps

    expect(fpAfter).toBeLessThanOrEqual(fpBefore + 1e-3)
  })

  it("FT retune reaches at least the best single-swap DPS the retunement panel could find", () => {
    const p = piece([w("crit", 0.05), w("agility", 20), w("momentum", 20), EMPTY, EMPTY], {
      attunement: "",
      attunementValue: 0,
    })
    const inputs = withInventory(p, /* equipped */ true)
    runEngine(inputs)
    const ft = getFTPiece(p, inputs)
    const baseline = applyPieceContribution(inputs, p, -1)
    const ftDps = runEngine(applyPieceContribution(baseline, ft, +1)).dps

    let bestSwapDps = runEngine(applyPieceContribution(baseline, p, +1)).dps
    const pool = poolForClass(inputs.classId)
    const specs = getWordSpecs(inputs)
    if (pool) {
      for (const slotIndex of rerollableSlots(p)) {
        const annotated = annotatePoolForSlot(p, slotIndex, pool)
        for (const { word, legal, isCurrent } of annotated) {
          if (!legal || isCurrent) continue
          const spec = specs.find((s) => s.word === word)
          if (!spec) continue
          const swappedWords = p.words.map((wd, i) =>
            i === slotIndex ? { word, value: spec.amount, retuned: true } : wd,
          ) as GearPiece["words"]
          const swapped: GearPiece = { ...p, words: swappedWords }
          const dps = runEngine(applyPieceContribution(baseline, swapped, +1)).dps
          if (dps > bestSwapDps) bestSwapDps = dps
        }
      }
    }
    expect(ftDps).toBeGreaterThanOrEqual(bestSwapDps - 1e-6)
  })

  it("upgrades the attunement to the best legal option at its max value", () => {
    const p = piece([w("crit", 0.05), w("agility", 30), w("momentum", 30), EMPTY, EMPTY], {
      attunement: "",
      attunementValue: 0,
    })
    const inputs = withInventory(p)
    runEngine(inputs)
    const ft = getFTPiece(p, inputs)

    expect(ft.attunement).toBe("physPen")
    expect(ft.attunementValue).toBeGreaterThan(p.attunementValue)
  })

  it("for non-relayed gear with all stats at low values, max-relayed beats keeping current values", () => {
    const p = piece([
      w("crit", 0.001),
      w("agility", 1),
      w("momentum", 1),
      w("maxBamboocut", 1),
      EMPTY,
    ])
    const inputs = withInventory(p)
    runEngine(inputs)
    const ft = getFTPiece(p, inputs)
    expect(ft.relayed).toBe(true)
    const specs = getWordSpecs(inputs)
    for (const wd of ft.words) {
      if (!wd.word) continue
      const spec = specs.find((s) => s.word === wd.word)
      const cap = spec ? relayedCapValue(spec.amount, spec.unit) : 0
      expect(wd.value).toBeCloseTo(cap, 6)
    }
  })
})

describe("ftDpsWhenEquipped", () => {
  it("returns DPS strictly higher than baseline for an obviously upgradable piece", () => {
    const p = piece([w("crit", 0.001), w("agility", 1), EMPTY, EMPTY, EMPTY])
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const dps = ftDpsWhenEquipped(p, inputs)
    expect(dps).toBeGreaterThan(baselineDps)
  })

  it("for a relayed piece with weak word values, FT DPS strictly beats baseline (modulation kicks in)", () => {
    const p = piece([w("crit", 0.001), w("agility", 1), EMPTY, EMPTY, EMPTY], {
      relayed: true,
      attunement: "",
      attunementValue: 0,
    })
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const dps = ftDpsWhenEquipped(p, inputs)
    expect(dps).toBeGreaterThan(baselineDps)
  })
})

describe("computeDpsDeltas → fullPotential field", () => {
  it("for the equipped piece, emits the upside from the current build (FT − baseline)", () => {
    const p = piece([w("crit", 0.005), w("agility", 2), EMPTY, EMPTY, EMPTY])
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const res = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps,
      pieceIds: [p.id],
    })
    expect(res.deltas[p.id].fullPotential).toBeGreaterThan(0)
  })

  it("for the equipped piece already at full potential, emits ~0", () => {
    const specs = getWordSpecs(umbraInputs)
    const at = (word: string) => {
      const spec = specs.find((s) => s.word === word)
      return spec ? relayedCapValue(spec.amount, spec.unit) : 0
    }
    const p = piece(
      [
        { word: "crit", value: at("crit"), retuned: false },
        { word: "agility", value: at("agility"), retuned: false },
        { word: "momentum", value: at("momentum"), retuned: false },
        { word: "maxBamboocut", value: at("maxBamboocut"), retuned: false },
        { word: "maxPhys", value: at("maxPhys"), retuned: false },
      ] as GearPiece["words"],
      { relayed: true, attunement: "physPen", attunementValue: 0.11 },
    )
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const res = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps,
      pieceIds: [p.id],
    })
    expect(Math.abs(res.deltas[p.id].fullPotential)).toBeLessThan(1)
  })

  it("emits a positive FT delta when the candidate's potential beats the empty slot", () => {
    const p = piece([w("crit", 0.05), w("agility", 30), EMPTY, EMPTY, EMPTY])
    const inputs = withInventory(p, /* equipped */ false)
    const baselineDps = runEngine(inputs).dps
    const res = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps,
      pieceIds: [p.id],
    })
    expect(res.deltas[p.id].fullPotential).toBeGreaterThan(0)
    expect(res.deltas[p.id].fullPotentialE).toBeCloseTo(res.deltas[p.id].fullPotential, 6)
  })

  it("for the equipped piece itself, FP(E) is exactly zero (FT − FT)", () => {
    const p = piece([w("crit", 0.05), w("agility", 30), EMPTY, EMPTY, EMPTY])
    const inputs = withInventory(p, /* equipped */ true)
    const baselineDps = runEngine(inputs).dps
    const res = computeDpsDeltas({
      reqId: 1,
      inputs,
      baselineDps,
      pieceIds: [p.id],
    })
    expect(res.deltas[p.id].fullPotentialE).toBeCloseTo(0, 6)
  })

  it("FP(E) is non-positive when the candidate has strictly weaker word values than the equipped piece", () => {
    const E = piece(
      [w("crit", 0.07), w("agility", 35), w("momentum", 35), w("maxPhys", 60), EMPTY],
      { id: "equipped" },
    )
    const P = piece([w("crit", 0.005), w("agility", 2), w("momentum", 2), w("maxPhys", 5), EMPTY], {
      id: "weakcand",
    })
    const base: Inputs = {
      ...umbraInputs,
      inventory: [E, P],
      equipped: { ...umbraInputs.equipped, [E.slot]: E.id },
    }
    const baselineDps = runEngine(base).dps
    const res = computeDpsDeltas({
      reqId: 1,
      inputs: base,
      baselineDps,
      pieceIds: [P.id],
    })
    expect(res.deltas[P.id].fullPotentialE).toBeLessThanOrEqual(0)
  })
})
