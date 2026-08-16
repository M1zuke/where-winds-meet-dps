import type { GearPiece } from "../../../../engine/types"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"

export interface InventoryRow {
  piece: GearPiece
  isEquipped: boolean
}

export function sortInventoryRowsByDps(
  rows: InventoryRow[],
  dpsDeltas: DpsDeltaMap,
): InventoryRow[] {
  return [...rows].sort((rowA, rowB) => {
    const deltaA = dpsDeltas[rowA.piece.id]
    const deltaB = dpsDeltas[rowB.piece.id]
    if (deltaA === undefined && deltaB === undefined) return 0
    if (deltaA === undefined) return 1
    if (deltaB === undefined) return -1
    if (deltaB.upgraded !== deltaA.upgraded) return deltaB.upgraded - deltaA.upgraded
    return deltaB.fullPotential - deltaA.fullPotential
  })
}
