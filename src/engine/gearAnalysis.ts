import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone } from "./gearStats"
import { getWordSpecs, type WordSpec } from "./itemRanking"
import { poolForClass } from "../definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"
import { attunementsFor } from "./attunements"
import { GEAR_SLOTS } from "./types"
import type { GearPiece, GearSlot, GearWordId, Inputs } from "./types"
import type { RetunementPool } from "../definitions/classes/classDef"

export interface GearSlotAnalysisRow {
  slot: GearSlot
  pieceId: string | null
  retuneGain: number | null
  reattuneGain: number | null
  relayGain: number | null
  unequipLoss: number
}

function equippedPiece(inputs: Inputs, slot: GearSlot): GearPiece | null {
  const equippedId = inputs.equipped[slot]
  if (!equippedId) return null
  return inputs.inventory.find((piece) => piece.id === equippedId) ?? null
}

function dpsWithPiece(slotEmpty: Inputs, piece: GearPiece): number {
  return runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps
}

function bestRetuneDps(
  slotEmpty: Inputs,
  piece: GearPiece,
  pool: RetunementPool | null,
  specByWord: Map<GearWordId, WordSpec<GearWordId>>,
): number | null {
  if (piece.relayed) return null
  if (!pool || pool.stats.length === 0) return null

  let best: number | null = null
  for (const slotIndex of rerollableSlots(piece)) {
    for (const { word, legal, isCurrent } of annotatePoolForSlot(piece, slotIndex, pool)) {
      if (!legal || isCurrent) continue
      const spec = specByWord.get(word)
      if (!spec) continue
      const words = piece.words.map((existing, index) =>
        index === slotIndex ? { word, value: spec.amount, retuned: true } : existing,
      ) as GearPiece["words"]
      const dps = dpsWithPiece(slotEmpty, { ...piece, words })
      if (best === null || dps > best) best = dps
    }
  }
  return best
}

function bestReattuneDps(slotEmpty: Inputs, piece: GearPiece, classId: string): number | null {
  const options = attunementsFor(piece.slot, classId)
  if (options.length === 0) return null

  let best: number | null = null
  for (const option of options) {
    const dps = dpsWithPiece(slotEmpty, {
      ...piece,
      attunement: option.id,
      attunementValue: option.max,
    })
    if (best === null || dps > best) best = dps
  }
  return best
}

function relayedDps(slotEmpty: Inputs, piece: GearPiece, inputs: Inputs): number | null {
  if (piece.relayed) return null
  return dpsWithPiece(slotEmpty, maxRelayedClone(piece, inputs))
}

export function computeGearAnalysis(inputs: Inputs, baselineDps: number): GearSlotAnalysisRow[] {
  const pool = poolForClass(inputs.classId)
  const specByWord = new Map(getWordSpecs(inputs).map((spec) => [spec.word, spec] as const))

  return GEAR_SLOTS.map((slot) => {
    const piece = equippedPiece(inputs, slot)
    if (!piece) {
      return {
        slot,
        pieceId: null,
        retuneGain: null,
        reattuneGain: null,
        relayGain: null,
        unequipLoss: 0,
      }
    }

    const slotEmpty = applyPieceContribution(inputs, piece, -1)
    const gainOver = (dps: number | null) => (dps === null ? null : dps - baselineDps)

    return {
      slot,
      pieceId: piece.id,
      retuneGain: gainOver(bestRetuneDps(slotEmpty, piece, pool, specByWord)),
      reattuneGain: gainOver(bestReattuneDps(slotEmpty, piece, inputs.classId)),
      relayGain: gainOver(relayedDps(slotEmpty, piece, inputs)),
      unequipLoss: baselineDps - runEngine(slotEmpty).dps,
    }
  })
}
