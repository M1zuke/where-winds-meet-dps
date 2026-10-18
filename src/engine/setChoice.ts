import type { BowSet, BowSlot, GearPiece, Inputs } from "./types"
import { WEAPON_SLOTS } from "./types"

export const NO_SET_CHOICE = "__none"

export type SetChoiceTarget = { kind: "piece"; pieceId: string } | { kind: "bow"; slot: BowSlot }

export function equippedSetBearingPieceIds(inputs: Inputs): string[] {
  const inventoryIds = new Set(inputs.inventory.map((piece) => piece.id))
  return WEAPON_SLOTS.map((slot) => inputs.equipped[slot]).filter(
    (pieceId): pieceId is string => pieceId !== null && inventoryIds.has(pieceId),
  )
}

function pieceWithSet(piece: GearPiece, setId: string | null): GearPiece {
  if (setId !== null) return { ...piece, set: setId }
  const { set: _removed, ...rest } = piece
  void _removed
  return rest
}

export function withSetChoice(
  inputs: Inputs,
  target: SetChoiceTarget,
  applyToGroup: boolean,
  setId: string | null,
): Inputs {
  if (target.kind === "bow") {
    const bowPiece = inputs.bowGear[target.slot]
    if (!bowPiece) return inputs
    return {
      ...inputs,
      bowGear: { ...inputs.bowGear, [target.slot]: { ...bowPiece, set: setId as BowSet } },
    }
  }
  const affected = new Set([
    target.pieceId,
    ...(applyToGroup ? equippedSetBearingPieceIds(inputs) : []),
  ])
  return {
    ...inputs,
    inventory: inputs.inventory.map((piece) =>
      affected.has(piece.id) ? pieceWithSet(piece, setId) : piece,
    ),
  }
}
