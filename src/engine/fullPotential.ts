// Every retune and attunement candidate is scored with an exact runEngine
// call on the piece-removed baseline (not a linearised marginal-rate
// pre-pass — that disagreed with the retunement panel and drifted between
// build states).
import type { GearPiece, Inputs } from "./types"
import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone } from "./gearStats"
import { getWordSpecs } from "./itemRanking"
import { attunementsFor } from "./attunements"
import { poolForClass } from "../data/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"

function applyBestRetune(piece: GearPiece, inputs: Inputs): GearPiece {
  if (piece.relayed) return piece
  const pool = poolForClass(inputs.classId)
  if (!pool || pool.stats.length === 0) return piece

  const specs = getWordSpecs(inputs)
  const baseline = applyPieceContribution(inputs, piece, -1)
  const currentDps = runEngine(applyPieceContribution(baseline, piece, +1)).dps

  let bestPiece = piece
  let bestDps = currentDps
  for (const slotIndex of rerollableSlots(piece)) {
    const annotated = annotatePoolForSlot(piece, slotIndex, pool)
    for (const { word, legal, isCurrent } of annotated) {
      if (!legal || isCurrent) continue
      const spec = specs.find((s) => s.word === word)
      if (!spec) continue
      const swappedWords = piece.words.map((w, i) =>
        i === slotIndex ? { word, value: spec.amount, retuned: true } : w,
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

function applyBestAttunement(piece: GearPiece, inputs: Inputs): GearPiece {
  const opts = attunementsFor(piece.slot, inputs.classId).filter((o) => o.enginePath !== null)
  if (opts.length === 0) return piece

  const baseline = applyPieceContribution(inputs, piece, -1)
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
  if (piece.relayed) {
    return applyBestAttunement(maxRelayedClone(piece, inputs), inputs)
  }

  const retuned = applyBestRetune(piece, inputs)

  const baseline = applyPieceContribution(inputs, piece, -1)
  const retunedDps = runEngine(applyPieceContribution(baseline, retuned, +1)).dps
  const relayed = maxRelayedClone(retuned, inputs)
  const relayedDps = runEngine(applyPieceContribution(baseline, relayed, +1)).dps
  const afterRelayDecision = relayedDps > retunedDps ? relayed : retuned

  return applyBestAttunement(afterRelayDecision, inputs)
}

export function ftDpsWhenEquipped(piece: GearPiece, inputs: Inputs): number {
  const equippedId = inputs.equipped[piece.slot]
  const equipped = equippedId ? (inputs.inventory.find((p) => p.id === equippedId) ?? null) : null
  const baseline = equipped ? applyPieceContribution(inputs, equipped, -1) : inputs
  const ft = getFTPiece(piece, inputs)
  return runEngine(applyPieceContribution(baseline, ft, +1)).dps
}

export function ftDpsWithSlotEmpty(slot: GearPiece["slot"], inputs: Inputs): number {
  const equippedId = inputs.equipped[slot]
  if (!equippedId) return runEngine(inputs).dps
  const equipped = inputs.inventory.find((p) => p.id === equippedId) ?? null
  if (!equipped) return runEngine(inputs).dps
  return runEngine(applyPieceContribution(inputs, equipped, -1)).dps
}
