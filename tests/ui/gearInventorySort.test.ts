import { describe, expect, it } from "vitest"
import {
  sortInventoryRowsByDps,
  type InventoryRow,
} from "../../src/ui/features/gear/gear-inventory-panel/inventoryRows"
import type { DpsDelta } from "../../src/engine/dpsWorker"
import type { DpsDeltaMap } from "../../src/ui/hooks/useDpsDeltas"
import type { GearPiece } from "../../src/engine/types"

function piece(id: string): GearPiece {
  return {
    id,
    slot: "helm",
    level: 96,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: [
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

function row(id: string): InventoryRow {
  return { piece: piece(id), isEquipped: false }
}

function delta(current: number, upgraded: number, fullPotential: number): DpsDelta {
  return { current, upgraded, fullPotential, fullPotentialE: fullPotential }
}

describe("sortInventoryRowsByDps", () => {
  it("orders rows by descending upgraded delta: positive, then zero, then negative", () => {
    const rows = [row("neg"), row("pos"), row("zero")]
    const deltas: DpsDeltaMap = {
      neg: delta(0, -100, 0),
      pos: delta(0, 500, 0),
      zero: delta(0, 0, 0),
    }
    const sorted = sortInventoryRowsByDps(rows, deltas)
    expect(sorted.map((r) => r.piece.id)).toEqual(["pos", "zero", "neg"])
  })

  it("breaks a tie on equal upgraded delta using fullPotential (descending)", () => {
    const rows = [row("a"), row("b")]
    const deltas: DpsDeltaMap = {
      a: delta(0, 100, 50),
      b: delta(0, 100, 200),
    }
    const sorted = sortInventoryRowsByDps(rows, deltas)
    expect(sorted.map((r) => r.piece.id)).toEqual(["b", "a"])
  })

  it("puts rows with no computed delta at the end, keeping their relative input order", () => {
    const rows = [row("pending1"), row("scored"), row("pending2")]
    const deltas: DpsDeltaMap = {
      scored: delta(0, 10, 0),
    }
    const sorted = sortInventoryRowsByDps(rows, deltas)
    expect(sorted.map((r) => r.piece.id)).toEqual(["scored", "pending1", "pending2"])
  })

  it("does not mutate the input array", () => {
    const rows = [row("a"), row("b")]
    const original = [...rows]
    const deltas: DpsDeltaMap = { a: delta(0, 1, 0), b: delta(0, 2, 0) }
    sortInventoryRowsByDps(rows, deltas)
    expect(rows).toEqual(original)
  })
})
