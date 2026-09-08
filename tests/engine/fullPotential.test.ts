import { describe, expect, it } from "vitest"
import { getFTPiece, ftDpsWhenEquipped } from "../../src/engine/fullPotential"
import { computeDpsDeltas } from "../../src/engine/dpsWorker"
import { runEngine } from "../../src/engine/dps"
import {
  applyPieceContribution,
  maxRelayedClone,
  relayedCapValue,
} from "../../src/engine/gearStats"
import { attunementMax, attunementsFor } from "../../src/engine/attunements"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { poolForClass } from "../../src/definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "../../src/engine/retunement"
import { defaultInputs } from "../../src/engine/defaults"
import { gearLevelForBreakthrough } from "../../src/definitions/baseStats/breakthroughs"

import type { GearLevel, GearPiece, Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
const BREAKTHROUGH_LEVEL = gearLevelForBreakthrough(umbraInputs.breakthrough)

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
    const specs = getWordSpecs(inputs, BREAKTHROUGH_LEVEL)
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
    const specs = getWordSpecs(inputs, p.level)
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
    const specs = getWordSpecs(inputs, p.level)
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
    const specs = getWordSpecs(inputs, BREAKTHROUGH_LEVEL)
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
    const specs = getWordSpecs(umbraInputs, BREAKTHROUGH_LEVEL)
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

// Every fixture below is a level-96 piece, so the breakthrough has to resolve
// to that same gear level — otherwise relaying (which follows the
// breakthrough) would target a different ceiling than the pieces carry.
describe("FT variant selection", () => {
  const level96Inputs = { ...umbraInputs, breakthrough: 16 }

  function derivedInputs(equipped: GearPiece[], inventory: GearPiece[]): Inputs {
    const equippedIds = Object.fromEntries(equipped.map((p) => [p.slot, p.id]))
    return applyBowSet(
      applyArmorSet(
        withDerivedStats({
          ...level96Inputs,
          inventory: [...equipped, ...inventory],
          equipped: { ...level96Inputs.equipped, ...equippedIds },
        }),
      ),
    )
  }

  // Mirrors `getFTPiece`'s reachable space: a plain retune stays at the piece's
  // own gear level, while relaying — and any retune stacked on top of a relay —
  // follows the current breakthrough's level instead.
  function bestReachableDps(candidate: GearPiece, inputs: Inputs): number {
    const equippedId = inputs.equipped[candidate.slot]
    const equipped = equippedId ? (inputs.inventory.find((p) => p.id === equippedId) ?? null) : null
    const slotEmpty = equipped ? applyPieceContribution(inputs, equipped, -1) : inputs
    const pieceLevel = candidate.level
    const breakthroughLevel = gearLevelForBreakthrough(inputs.breakthrough)
    const pool = poolForClass(inputs.classId)
    const attunements = attunementsFor(candidate.slot, inputs.classId).filter(
      (option) => option.enginePath !== null,
    )

    function retuneVariantsOf(piece: GearPiece, level: GearLevel): GearPiece[] {
      if (!pool) return [piece]
      const specs = getWordSpecs(inputs, level)
      const variants: GearPiece[] = [piece]
      for (const slotIndex of rerollableSlots(piece)) {
        for (const { word, legal, isCurrent } of annotatePoolForSlot(piece, slotIndex, pool)) {
          if (!legal || isCurrent) continue
          const spec = specs.find((s) => s.word === word)
          if (!spec) continue
          const value = piece.relayed ? relayedCapValue(spec.amount, spec.unit) : spec.amount
          variants.push({
            ...piece,
            words: piece.words.map((existing, index) =>
              index === slotIndex ? { word, value, retuned: true } : existing,
            ) as GearPiece["words"],
          })
        }
      }
      return variants
    }

    const reachablePieces: { piece: GearPiece; level: GearLevel }[] = candidate.relayed
      ? [{ piece: maxRelayedClone(candidate, inputs, breakthroughLevel), level: breakthroughLevel }]
      : [
          ...retuneVariantsOf(candidate, pieceLevel).map((piece) => ({ piece, level: pieceLevel })),
          ...retuneVariantsOf(
            maxRelayedClone(candidate, inputs, breakthroughLevel),
            breakthroughLevel,
          ).map((piece) => ({ piece, level: breakthroughLevel })),
        ]

    let best = -Infinity
    for (const { piece, level } of reachablePieces) {
      for (const attunement of [null, ...attunements]) {
        const reachable: GearPiece = attunement
          ? {
              ...piece,
              attunement: attunement.id,
              attunementValue: attunementMax(attunement, level),
            }
          : piece
        best = Math.max(best, runEngine(applyPieceContribution(slotEmpty, reachable, +1)).dps)
      }
    }
    return best
  }

  const WEAPON_BASE: Partial<GearPiece> = {
    level: 96,
    minPhys: 65,
    maxPhys: 151,
    attunement: "physPen",
    attunementValue: 0.11,
  }

  const relayedHelm = piece(
    [
      w("maxPhys", 73.13),
      w("power", 46),
      w("agility", 46),
      w("momentum", 46),
      w("maxFormless", 41.55),
    ],
    {
      id: "helm-piece",
      slot: "helm",
      level: 96,
      minPhys: 0,
      maxPhys: 0,
      relayed: true,
      attunement: "physPen",
      attunementValue: 0.11,
    },
  )

  it("scores an unequipped candidate against its own slot emptied, not against a build still holding the equipped piece", () => {
    const equippedWeapon = piece(
      [
        w("maxFormless", 41.28),
        w("maxFormless", 41.19),
        w("swordBoost", 0.0583),
        w("maxPhys", 73.13),
        w("momentum", 45.57),
      ],
      { ...WEAPON_BASE, id: "equipped-weapon", relayed: true },
    )
    const candidate = piece(
      [
        w("maxPhys", 64.7),
        w("maxFormless", 43.9),
        w("momentum", 45.1),
        w("swordBoost", 0.049),
        w("affinity", 0.044),
      ],
      { ...WEAPON_BASE, id: "candidate-weapon" },
    )
    const inputs = derivedInputs([equippedWeapon, relayedHelm], [candidate])

    expect(ftDpsWhenEquipped(candidate, inputs)).toBeCloseTo(bestReachableDps(candidate, inputs), 6)
  })

  it("picks the retune at the value the word carries once the piece is relayed, not at its unrelayed roll", () => {
    const candidate = piece(
      [
        w("maxPhys", 5),
        w("maxFormless", 43.9),
        w("momentum", 45.1),
        w("swordBoost", 0.049),
        w("affinity", 0.01),
      ],
      { ...WEAPON_BASE, id: "candidate-weapon" },
    )
    const inputs = derivedInputs([candidate, relayedHelm], [])

    expect(ftDpsWhenEquipped(candidate, inputs)).toBeCloseTo(bestReachableDps(candidate, inputs), 6)
  })
})
