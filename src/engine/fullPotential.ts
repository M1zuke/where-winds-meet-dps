import type { GearPiece, GearSlot, Inputs } from "./types"
import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone, relayedCapValue } from "./gearStats"
import { getWordSpecs } from "./itemRanking"
import { attunementsFor } from "./attunements"
import { poolForClass } from "../definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"

function slotEmptyBaseline(slot: GearSlot, inputs: Inputs): Inputs {
  const equippedId = inputs.equipped[slot]
  const equipped = equippedId ? (inputs.inventory.find((p) => p.id === equippedId) ?? null) : null
  return equipped ? applyPieceContribution(inputs, equipped, -1) : inputs
}

function bestRetunedVariant(piece: GearPiece, inputs: Inputs, baseline: Inputs): GearPiece {
  const pool = poolForClass(inputs.classId)
  if (!pool || pool.stats.length === 0) return piece

  const specs = getWordSpecs(inputs)
  let bestPiece = piece
  let bestDps = runEngine(applyPieceContribution(baseline, piece, +1)).dps

  for (const slotIndex of rerollableSlots(piece)) {
    const annotated = annotatePoolForSlot(piece, slotIndex, pool)
    for (const { word, legal, isCurrent } of annotated) {
      if (!legal || isCurrent) continue
      const spec = specs.find((s) => s.word === word)
      if (!spec) continue
      const value = piece.relayed ? relayedCapValue(spec.amount, spec.unit) : spec.amount
      const swappedWords = piece.words.map((existing, index) =>
        index === slotIndex ? { word, value, retuned: true } : existing,
      ) as GearPiece["words"]
      const candidate: GearPiece = { ...piece, words: swappedWords }
      const dps = runEngine(applyPieceContribution(baseline, candidate, +1)).dps
      if (dps > bestDps) {
        bestDps = dps
        bestPiece = candidate
      }
    }
  }
  return bestPiece
}

function applyBestAttunement(piece: GearPiece, inputs: Inputs, baseline: Inputs): GearPiece {
  const opts = attunementsFor(piece.slot, inputs.classId).filter((o) => o.enginePath !== null)
  if (opts.length === 0) return piece

  let bestPiece = piece
  let bestDps = runEngine(applyPieceContribution(baseline, piece, +1)).dps
  for (const opt of opts) {
    const candidate: GearPiece = {
      ...piece,
      attunement: opt.id,
      attunementValue: opt.max,
    }
    const dps = runEngine(applyPieceContribution(baseline, candidate, +1)).dps
    if (dps > bestDps) {
      bestDps = dps
      bestPiece = candidate
    }
  }
  return bestPiece
}

export function getFTPiece(piece: GearPiece, inputs: Inputs): GearPiece {
  const baseline = slotEmptyBaseline(piece.slot, inputs)

  if (piece.relayed) {
    return applyBestAttunement(maxRelayedClone(piece, inputs), inputs, baseline)
  }

  const retuned = bestRetunedVariant(piece, inputs, baseline)
  const retunedDps = runEngine(applyPieceContribution(baseline, retuned, +1)).dps
  const relayed = bestRetunedVariant(maxRelayedClone(piece, inputs), inputs, baseline)
  const relayedDps = runEngine(applyPieceContribution(baseline, relayed, +1)).dps
  const afterRelayDecision = relayedDps > retunedDps ? relayed : retuned

  return applyBestAttunement(afterRelayDecision, inputs, baseline)
}

export function ftDpsWhenEquipped(piece: GearPiece, inputs: Inputs): number {
  const baseline = slotEmptyBaseline(piece.slot, inputs)
  const ft = getFTPiece(piece, inputs)
  return runEngine(applyPieceContribution(baseline, ft, +1)).dps
}

export function ftDpsWithSlotEmpty(slot: GearSlot, inputs: Inputs): number {
  return runEngine(slotEmptyBaseline(slot, inputs)).dps
}
