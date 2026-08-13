import { describe, expect, it } from "vitest"
import {
  ALL_REROLLABLE_SLOTS,
  annotatePoolForSlot,
  filterPoolForSlot,
  rerollableSlots,
} from "../../src/engine/retunement"
import { computeReattunement, computeRetunement } from "../../src/engine/dpsWorker"
import { ATTUNEMENT_OPTIONS, getAttunement } from "../../src/engine/attunements"
import { runEngine } from "../../src/engine/dps"
import { applyPieceContribution } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { poolForClass } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"

const BELLSTRIKE_POOL = poolForClass("bellstrikeUmbra")!

function piece(words: GearPiece["words"], overrides: Partial<GearPiece> = {}): GearPiece {
  return {
    id: "test",
    slot: "helm",
    level: 91,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
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

describe("filterPoolForSlot", () => {
  it("returns the full Bellstrike pool when no stat is yet on the gear", () => {
    const p = piece([EMPTY, EMPTY, EMPTY, EMPTY, EMPTY])
    for (const slot of ALL_REROLLABLE_SLOTS) {
      const f = filterPoolForSlot(p, slot, BELLSTRIKE_POOL)
      expect(f.candidates).toEqual(BELLSTRIKE_POOL.stats)
      expect(f.poolSize).toBe(BELLSTRIKE_POOL.stats.length)
    }
  })

  it("allows the first-slot stat to appear once more in slots 2-5", () => {
    const p = piece([w("Crit", 0.07), EMPTY, EMPTY, EMPTY, EMPTY])
    for (const slot of ALL_REROLLABLE_SLOTS) {
      const f = filterPoolForSlot(p, slot, BELLSTRIKE_POOL)
      expect(f.candidates).toContain("Crit")
    }
  })

  it("forbids a third copy when the first-slot stat already appears twice", () => {
    const p = piece([w("Crit", 0.07), w("Crit", 0.05), EMPTY, EMPTY, EMPTY])
    const f3 = filterPoolForSlot(p, 2, BELLSTRIKE_POOL)
    const f4 = filterPoolForSlot(p, 3, BELLSTRIKE_POOL)
    const f5 = filterPoolForSlot(p, 4, BELLSTRIKE_POOL)
    expect(f3.candidates).not.toContain("Crit")
    expect(f4.candidates).not.toContain("Crit")
    expect(f5.candidates).not.toContain("Crit")
    const f2 = filterPoolForSlot(p, 1, BELLSTRIKE_POOL)
    expect(f2.candidates).toContain("Crit")
  })

  it("blocks duplicates of any non-first-slot stat", () => {
    const p = piece([w("Crit", 0.07), w("Momentum", 35), EMPTY, EMPTY, EMPTY])
    expect(filterPoolForSlot(p, 2, BELLSTRIKE_POOL).candidates).not.toContain("Momentum")
    expect(filterPoolForSlot(p, 3, BELLSTRIKE_POOL).candidates).not.toContain("Momentum")
    expect(filterPoolForSlot(p, 4, BELLSTRIKE_POOL).candidates).not.toContain("Momentum")
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).toContain("Momentum")
  })

  it("treats empty slots as having no stat", () => {
    const p = piece([w("Crit", 0.07), EMPTY, w("Power", 35), EMPTY, EMPTY])
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).not.toContain("Power")
    expect(filterPoolForSlot(p, 3, BELLSTRIKE_POOL).candidates).not.toContain("Power")
    expect(filterPoolForSlot(p, 4, BELLSTRIKE_POOL).candidates).not.toContain("Power")
    expect(filterPoolForSlot(p, 2, BELLSTRIKE_POOL).candidates).toContain("Power")
    expect(filterPoolForSlot(p, 1, BELLSTRIKE_POOL).candidates).toContain("Momentum")
  })

  it("covers the listed Bellstrike pool", () => {
    expect(BELLSTRIKE_POOL.stats).toEqual([
      "Affinity",
      "Max Phys",
      "Momentum",
      "Max Bellstrike",
      "Power",
      "Crit",
    ])
  })
})

describe("rerollableSlots", () => {
  it("returns all of slots 1..4 when no slot is R-marked", () => {
    const p = piece([w("Crit", 0.07), w("Agility", 35), w("Momentum", 35), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([1, 2, 3, 4])
  })

  it("returns only the R-marked slot when one slot has retuned=true", () => {
    const p = piece([w("Crit", 0.07), w("Agility", 35), w("Momentum", 35, true), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([2])
  })

  it("ignores R-flag on slot 0 (first tunement is always locked)", () => {
    const p = piece([w("Crit", 0.07, true), w("Agility", 35), w("Momentum", 35), EMPTY, EMPTY])
    expect(rerollableSlots(p)).toEqual([1, 2, 3, 4])
  })

  it("returns multiple slots only if multiple R-flags exist (data-error tolerant)", () => {
    const p = piece([
      w("Crit", 0.07),
      w("Agility", 35, true),
      w("Momentum", 35, true),
      EMPTY,
      EMPTY,
    ])
    expect(rerollableSlots(p)).toEqual([1, 2])
  })
})

describe("annotatePoolForSlot", () => {
  it("flags the current slot's stat with isCurrent", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), EMPTY, EMPTY, EMPTY])
    const annotated = annotatePoolForSlot(p, 1, BELLSTRIKE_POOL)
    const min = annotated.find((a) => a.word === "Power")
    expect(min?.isCurrent).toBe(true)
    expect(min?.legal).toBe(true)
  })

  it("returns one entry per pool stat regardless of legality", () => {
    const p = piece([w("Crit", 0.07), w("Momentum", 35), EMPTY, EMPTY, EMPTY])
    const annotated = annotatePoolForSlot(p, 2, BELLSTRIKE_POOL)
    expect(annotated).toHaveLength(BELLSTRIKE_POOL.stats.length)
    expect(annotated.find((a) => a.word === "Momentum")?.legal).toBe(false)
  })
})

describe("computeRetunement (worker compute)", () => {
  function withPieceInInventory(p: GearPiece): Inputs {
    return { ...defaultInputs, inventory: [p] }
  }

  it("returns empty rows for relayed pieces", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), EMPTY, EMPTY, EMPTY], { relayed: true })
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("relayed")
    expect(res.rows).toEqual([])
  })

  it("returns empty rows when the class has no pool entry", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = { ...withPieceInInventory(p), classId: "noSuchClass" }
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("no-pool")
    expect(res.rows).toEqual([])
  })

  it("emits 4 × poolSize rows for a non-relayed Bellstrike piece with no R-flag", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows).toHaveLength(ALL_REROLLABLE_SLOTS.length * BELLSTRIKE_POOL.stats.length)
  })

  it("emits only 1 × poolSize rows when an R-toggle locks a single slot", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), w("Momentum", 35, true), EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    expect(res.reason).toBe("ok")
    expect(res.rows).toHaveLength(BELLSTRIKE_POOL.stats.length)
    expect(new Set(res.rows.map((r) => r.slotIndex))).toEqual(new Set([2]))
  })

  it("reports ~0 ΔDPS for a candidate identical to the slot's current word", () => {
    const specs = getWordSpecs(defaultInputs)
    const minSpec = specs.find((s) => s.word === "Power")!
    const p = piece([w("Crit", 0.07), w("Power", minSpec.amount), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    const row = res.rows.find((r) => r.slotIndex === 1 && r.word === "Power")
    expect(row).toBeDefined()
    expect(row!.legal).toBe(true)
    expect(row!.isCurrent).toBe(true)
    expect(Math.abs(row!.deltaDps)).toBeLessThan(1e-6)
  })

  it("agrees with the virtually-equipped baseline on a hand-rolled swap", () => {
    const p = piece([w("Crit", 0.07), w("Power", 35), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })

    const specs = getWordSpecs(inputs)
    const targetSpec = specs.find((s) => s.word === "Max Bellstrike")!
    const swappedWords = p.words.map((wd, i) =>
      i === 2 ? { word: "Max Bellstrike", value: targetSpec.amount, retuned: true } : wd,
    ) as GearPiece["words"]
    const swapped: GearPiece = { ...p, words: swappedWords }
    const equipDps = runEngine(applyPieceContribution(inputs, p, +1)).dps
    const swappedDps = runEngine(applyPieceContribution(inputs, swapped, +1)).dps
    const handRolledDelta = swappedDps - equipDps

    const workerRow = res.rows.find((r) => r.slotIndex === 2 && r.word === "Max Bellstrike")!
    expect(workerRow.legal).toBe(true)
    expect(Math.abs(workerRow.deltaDps - handRolledDelta)).toBeLessThan(1e-6)
  })

  it("marks illegal candidates with deltaDps 0", () => {
    const p = piece([w("Power", 35), w("Power", 30), EMPTY, EMPTY, EMPTY])
    const inputs = withPieceInInventory(p)
    const res = computeRetunement({ reqId: 1, inputs, pieceId: p.id })
    const illegalSlot3 = res.rows.find((r) => r.slotIndex === 2 && r.word === "Power")!
    expect(illegalSlot3.legal).toBe(false)
    expect(illegalSlot3.deltaDps).toBe(0)
  })
})

describe("computeReattunement", () => {
  function withPieceInInventory(p: GearPiece): Inputs {
    return { ...defaultInputs, inventory: [p] }
  }

  function weaponPiece(overrides: Partial<GearPiece> = {}): GearPiece {
    return piece([w("Crit", 0.07), w("Agility", 35), w("Momentum", 35), EMPTY, EMPTY], {
      slot: "leftWeapon",
      minPhys: 1000,
      maxPhys: 2000,
      ...overrides,
    })
  }

  it("returns no-pool when the slot/class has no attunement options", () => {
    const armor = piece([w("Crit", 0.07), w("Agility", 35), EMPTY, EMPTY, EMPTY], {
      slot: "greaves",
      hp: 5000,
      physDef: 800,
      minPhys: 0,
      maxPhys: 0,
    })
    const inputs = { ...withPieceInInventory(armor), classId: "noSuchClass" }
    const res = computeReattunement({ reqId: 1, inputs, pieceId: armor.id })
    expect(res.reason).toBe("no-pool")
    expect(res.options).toEqual([])
  })

  it("emits one option per pool entry for a weapon slot", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    expect(res.reason).toBe("ok")
    expect(res.options.map((o) => o.optionId).sort()).toEqual(
      ["formlessPen", "physPen", "physResist"].sort(),
    )
    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(physPen.isCurrent).toBe(true)
    expect(physPen.inert).toBe(false)
    const physResist = res.options.find((o) => o.optionId === "physResist")!
    expect(physResist.inert).toBe(true)
  })

  it("agrees with the virtually-equipped baseline on headline ΔDPS at max value", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })

    const opt = getAttunement("physPen")!
    const swapped: GearPiece = { ...wp, attunement: "physPen", attunementValue: opt.max }
    const equipDps = runEngine(applyPieceContribution(inputs, wp, +1)).dps
    const swappedDps = runEngine(applyPieceContribution(inputs, swapped, +1)).dps
    const handDelta = swappedDps - equipDps

    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(Math.abs(physPen.deltaDpsAtMax - handDelta)).toBeLessThan(1e-6)
  })

  it("reports per-option probability of 0 for inert attunements when current option is non-inert", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const physResist = res.options.find((o) => o.optionId === "physResist")!
    expect(physResist.probImproveGivenOption).toBe(0)
  })

  it("computes overall probability as the mean of per-option conditional rates", () => {
    const wp = weaponPiece({ attunement: "physPen", attunementValue: 0.07 })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const mean =
      res.options.reduce((acc, o) => acc + o.probImproveGivenOption, 0) / res.options.length
    expect(Math.abs(res.probImproveOverall - mean)).toBeLessThan(1e-9)
    expect(res.probImproveOverall).toBeLessThanOrEqual(2 / res.options.length + 1e-9)
  })

  it("reports a per-option probability strictly between 0 and 1 when current value is mid-range", () => {
    const opt = getAttunement("physPen")!
    const wp = weaponPiece({ attunement: "physPen", attunementValue: opt.min })
    const inputs = withPieceInInventory(wp)
    const res = computeReattunement({ reqId: 1, inputs, pieceId: wp.id })
    const physPen = res.options.find((o) => o.optionId === "physPen")!
    expect(physPen.probImproveGivenOption).toBeGreaterThan(0.999)

    const wp2 = weaponPiece({
      attunement: "physPen",
      attunementValue: (opt.min + opt.max) / 2,
    })
    const inputs2 = withPieceInInventory(wp2)
    const res2 = computeReattunement({ reqId: 1, inputs: inputs2, pieceId: wp2.id })
    const physPen2 = res2.options.find((o) => o.optionId === "physPen")!
    expect(Math.abs(physPen2.probImproveGivenOption - 0.5)).toBeLessThan(0.02)
  })

  it("ATTUNEMENT_OPTIONS catalog is non-empty (sanity)", () => {
    expect(ATTUNEMENT_OPTIONS.length).toBeGreaterThan(0)
  })
})
