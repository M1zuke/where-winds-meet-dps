import type { GearPiece, Inputs } from "./types"
import { WEAPON_SLOTS } from "./types"

export const TWO_PIECE_SIZE = 2
export const FOUR_PIECE_SIZE = 4

export function equippedSetBearingPieces(inputs: Inputs): GearPiece[] {
  const pieceById = new Map(inputs.inventory.map((piece) => [piece.id, piece]))
  const pieces: GearPiece[] = []
  for (const slot of WEAPON_SLOTS) {
    const equippedId = inputs.equipped[slot]
    const piece = equippedId ? pieceById.get(equippedId) : undefined
    if (piece) pieces.push(piece)
  }
  return pieces
}

export function setPieceCount(inputs: Inputs, setId: string): number {
  return equippedSetBearingPieces(inputs).filter((piece) => piece.set === setId).length
}

export function setPieceCountWith(inputs: Inputs, pieceId: string, setId: string): number {
  const placed = inputs.inventory.find((piece) => piece.id === pieceId)
  if (!placed || !WEAPON_SLOTS.includes(placed.slot)) return setPieceCount(inputs, setId)
  const pieceById = new Map(inputs.inventory.map((piece) => [piece.id, piece]))
  return WEAPON_SLOTS.filter((slot) => {
    if (slot === placed.slot) return true
    const equippedId = inputs.equipped[slot]
    return equippedId ? pieceById.get(equippedId)?.set === setId : false
  }).length
}
