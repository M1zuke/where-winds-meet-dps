import type { EngineRunOptions, GearLevel, GearPiece, GearSlot, Inputs } from "./types"
import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone, relayedCapValue } from "./gearStats"
import { getWordSpecs } from "./itemRanking"
import { attunementMax, attunementsFor } from "./attunements"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
import { poolForClass } from "../definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"
import { engineRunOptionsFrom } from "./qiBar"
import { FPS } from "./timeline"

function slotEmptyBaseline(slot: GearSlot, inputs: Inputs): Inputs {
  const equippedId = inputs.equipped[slot]
  const equipped = equippedId ? (inputs.inventory.find((p) => p.id === equippedId) ?? null) : null
  return equipped ? applyPieceContribution(inputs, equipped, -1) : inputs
}

function bestRetunedVariant(
  piece: GearPiece,
  inputs: Inputs,
  baseline: Inputs,
  level: GearLevel,
  options: EngineRunOptions | undefined,
): GearPiece {
  const pool = poolForClass(inputs.classId)
  if (!pool || pool.stats.length === 0) return piece

  const specs = getWordSpecs(inputs, level)
  const baseRun = runEngine(applyPieceContribution(baseline, piece, +1), options)
  let bestPiece = piece
  let bestDps = baseRun.dps
  const sweepOptions = engineRunOptionsFrom(baseRun.qiBreaks, FPS)

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
      const dps = runEngine(applyPieceContribution(baseline, candidate, +1), sweepOptions).dps
      if (dps > bestDps) {
        bestDps = dps
        bestPiece = candidate
      }
    }
  }
  return bestPiece
}

function applyBestAttunement(
  piece: GearPiece,
  inputs: Inputs,
  baseline: Inputs,
  level: GearLevel,
  options: EngineRunOptions | undefined,
): GearPiece {
  const opts = attunementsFor(piece.slot, inputs.classId).filter((o) => o.enginePath !== null)
  if (opts.length === 0) return piece

  const baseRun = runEngine(applyPieceContribution(baseline, piece, +1), options)
  let bestPiece = piece
  let bestDps = baseRun.dps
  const sweepOptions = engineRunOptionsFrom(baseRun.qiBreaks, FPS)
  for (const opt of opts) {
    const candidate: GearPiece = {
      ...piece,
      attunement: opt.id,
      attunementValue: attunementMax(opt, level),
    }
    const dps = runEngine(applyPieceContribution(baseline, candidate, +1), sweepOptions).dps
    if (dps > bestDps) {
      bestDps = dps
      bestPiece = candidate
    }
  }
  return bestPiece
}

export function getFTPiece(
  piece: GearPiece,
  inputs: Inputs,
  options?: EngineRunOptions,
): GearPiece {
  const baseline = slotEmptyBaseline(piece.slot, inputs)
  const breakthroughLevel = gearLevelForBreakthrough(inputs.breakthrough)

  if (piece.relayed) {
    const relayedClone = maxRelayedClone(piece, inputs, breakthroughLevel)
    return applyBestAttunement(relayedClone, inputs, baseline, breakthroughLevel, options)
  }

  const referenceRun = runEngine(applyPieceContribution(baseline, piece, +1), options)
  const sweepOptions = engineRunOptionsFrom(referenceRun.qiBreaks, FPS)

  const retuned = bestRetunedVariant(piece, inputs, baseline, piece.level, sweepOptions)
  const retunedDps = runEngine(applyPieceContribution(baseline, retuned, +1), sweepOptions).dps
  const relayed = bestRetunedVariant(
    maxRelayedClone(piece, inputs, breakthroughLevel),
    inputs,
    baseline,
    breakthroughLevel,
    sweepOptions,
  )
  const relayedDps = runEngine(applyPieceContribution(baseline, relayed, +1), sweepOptions).dps
  const relayWins = relayedDps > retunedDps

  return applyBestAttunement(
    relayWins ? relayed : retuned,
    inputs,
    baseline,
    relayWins ? breakthroughLevel : piece.level,
    sweepOptions,
  )
}

export function ftDpsWhenEquipped(
  piece: GearPiece,
  inputs: Inputs,
  options?: EngineRunOptions,
): number {
  const baseline = slotEmptyBaseline(piece.slot, inputs)
  const ft = getFTPiece(piece, inputs, options)
  return runEngine(applyPieceContribution(baseline, ft, +1), options).dps
}

export function ftDpsWithSlotEmpty(
  slot: GearSlot,
  inputs: Inputs,
  options?: EngineRunOptions,
): number {
  return runEngine(slotEmptyBaseline(slot, inputs), options).dps
}
