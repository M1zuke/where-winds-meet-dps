import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone, relayedCapValue } from "./gearStats"
import { computeRanking, getWordSpecs } from "./itemRanking"
import { poolForClass } from "../definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"
import { attunementsFor } from "./attunements"
import { ftDpsWhenEquipped, ftDpsWithSlotEmpty } from "./fullPotential"
import { withDerivedStats } from "./derivedInputs"
import { applyArmorSet, applyBowSet, ARMOR_SET_OPTIONS, swapArsenal } from "./panel"
import { graduationInputs } from "./graduation"
import type {
  Arsenal,
  BowSet,
  GearPiece,
  GearSlot,
  GearWordName,
  Inputs,
  ItemRankingRow,
} from "./types"

export interface DpsDelta {
  current: number
  upgraded: number
  fullPotential: number
  fullPotentialE: number
}

export interface DpsWorkerRequest {
  reqId: number
  inputs: Inputs
  baselineDps: number
  pieceIds: string[]
  extraCandidates?: GearPiece[]
}

export interface DpsWorkerResponse {
  reqId: number
  deltas: Record<string, DpsDelta>
}

function dpsForSwap(unequippedBaseline: Inputs, candidate: GearPiece): number {
  const next = applyPieceContribution(unequippedBaseline, candidate, +1)
  return runEngine(next).dps
}

function computeDpsDeltas(req: DpsWorkerRequest): DpsWorkerResponse {
  const { inputs, baselineDps, pieceIds, extraCandidates } = req
  const out: Record<string, DpsDelta> = {}
  const byId = new Map<string, GearPiece>()
  for (const p of extraCandidates ?? []) byId.set(p.id, p)
  for (const p of inputs.inventory) byId.set(p.id, p)

  const ftRefBySlot = new Map<GearSlot, number>()
  function ftReferenceForSlot(slot: GearSlot): number {
    const cached = ftRefBySlot.get(slot)
    if (cached !== undefined) return cached
    const equippedId = inputs.equipped[slot]
    const equipped = equippedId ? (byId.get(equippedId) ?? null) : null
    const ref = equipped ? ftDpsWhenEquipped(equipped, inputs) : ftDpsWithSlotEmpty(slot, inputs)
    ftRefBySlot.set(slot, ref)
    return ref
  }

  for (const id of pieceIds) {
    const candidate = byId.get(id)
    if (!candidate) continue

    const equippedId = inputs.equipped[candidate.slot]
    const equipped = equippedId ? (byId.get(equippedId) ?? null) : null
    const unequippedBaseline = equipped ? applyPieceContribution(inputs, equipped, -1) : inputs

    const currentDps = dpsForSwap(unequippedBaseline, candidate)
    const upgraded = maxRelayedClone(candidate, inputs)
    const upgradedDps = dpsForSwap(unequippedBaseline, upgraded)

    const ftCandidateDps = ftDpsWhenEquipped(candidate, inputs)
    const fullPotential = ftCandidateDps - baselineDps
    const fullPotentialE = ftCandidateDps - ftReferenceForSlot(candidate.slot)

    out[id] = {
      current: currentDps - baselineDps,
      upgraded: upgradedDps - baselineDps,
      fullPotential,
      fullPotentialE,
    }
  }

  return { reqId: req.reqId, deltas: out }
}

export interface RetunementWorkerRequest {
  reqId: number
  inputs: Inputs
  pieceId: string
}

export interface RetunementRow {
  slotIndex: number
  word: GearWordName
  legal: boolean
  isCurrent: boolean
  deltaDps: number
  poolSize: number
}

export interface RetunementWorkerResponse {
  reqId: number
  pieceId: string
  rows: RetunementRow[]
  reason: "ok" | "no-piece" | "no-pool" | "relayed"
}

function inputsWithSlotEmpty(inputs: Inputs, slot: GearSlot): Inputs {
  const equippedId = inputs.equipped[slot]
  if (!equippedId) return inputs
  const equippedPiece = inputs.inventory.find((p) => p.id === equippedId)
  if (!equippedPiece) return inputs
  return applyPieceContribution(inputs, equippedPiece, -1)
}

function computeRetunement(req: RetunementWorkerRequest): RetunementWorkerResponse {
  const { inputs, pieceId } = req
  const piece = inputs.inventory.find((p) => p.id === pieceId)
  if (!piece) {
    return { reqId: req.reqId, pieceId, rows: [], reason: "no-piece" }
  }
  if (piece.relayed) {
    return { reqId: req.reqId, pieceId, rows: [], reason: "relayed" }
  }
  const pool = poolForClass(inputs.classId)
  if (!pool || pool.stats.length === 0) {
    return { reqId: req.reqId, pieceId, rows: [], reason: "no-pool" }
  }

  const specs = getWordSpecs(inputs)
  const specByWord = new Map(specs.map((s) => [s.word, s] as const))
  const rows: RetunementRow[] = []
  const slots = rerollableSlots(piece)

  const slotEmpty = inputsWithSlotEmpty(inputs, piece.slot)
  const equipDps = runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps

  for (const slotIndex of slots) {
    const annotated = annotatePoolForSlot(piece, slotIndex, pool)
    for (const { word, legal, isCurrent } of annotated) {
      if (!legal) {
        rows.push({
          slotIndex,
          word,
          legal: false,
          isCurrent: false,
          deltaDps: 0,
          poolSize: pool.stats.length,
        })
        continue
      }
      const spec = specByWord.get(word)
      if (!spec) {
        rows.push({
          slotIndex,
          word,
          legal: true,
          isCurrent,
          deltaDps: 0,
          poolSize: pool.stats.length,
        })
        continue
      }
      const swappedWords = piece.words.map((w, i) =>
        i === slotIndex ? { word, value: spec.amount, retuned: true } : w,
      ) as GearPiece["words"]
      const swapped: GearPiece = { ...piece, words: swappedWords }
      const dps = runEngine(applyPieceContribution(slotEmpty, swapped, +1)).dps
      rows.push({
        slotIndex,
        word,
        legal: true,
        isCurrent,
        deltaDps: dps - equipDps,
        poolSize: pool.stats.length,
      })
    }
  }

  return { reqId: req.reqId, pieceId, rows, reason: "ok" }
}

export interface ReattunementWorkerRequest {
  reqId: number
  inputs: Inputs
  pieceId: string
}

export interface ReattunementOption {
  optionId: string
  label: string
  min: number
  max: number
  deltaDpsAtMax: number
  probImproveGivenOption: number
  inert: boolean
  isCurrent: boolean
}

export interface ReattunementWorkerResponse {
  reqId: number
  pieceId: string
  options: ReattunementOption[]
  probImproveOverall: number
  reason: "ok" | "no-piece" | "no-pool"
}

function dpsWithAttunement(
  slotEmpty: Inputs,
  original: GearPiece,
  optionId: string,
  value: number,
): number {
  const swapped: GearPiece = { ...original, attunement: optionId, attunementValue: value }
  return runEngine(applyPieceContribution(slotEmpty, swapped, +1)).dps
}

function probLinearImprove(
  dpsMin: number,
  dpsMax: number,
  baseline: number,
  min: number,
  max: number,
): number {
  if (max <= min || Math.abs(dpsMax - dpsMin) < 1e-9) {
    return dpsMax > baseline + 1e-9 ? 1 : 0
  }
  if (dpsMax > dpsMin) {
    if (dpsMin >= baseline) return 1
    if (dpsMax <= baseline) return 0
    const vCrit = min + ((baseline - dpsMin) * (max - min)) / (dpsMax - dpsMin)
    return Math.max(0, Math.min(1, (max - vCrit) / (max - min)))
  }
  if (dpsMax >= baseline) return 1
  if (dpsMin <= baseline) return 0
  const vCrit = min + ((baseline - dpsMin) * (max - min)) / (dpsMax - dpsMin)
  return Math.max(0, Math.min(1, (vCrit - min) / (max - min)))
}

function computeReattunement(req: ReattunementWorkerRequest): ReattunementWorkerResponse {
  const { inputs, pieceId } = req
  const piece = inputs.inventory.find((p) => p.id === pieceId)
  if (!piece) {
    return { reqId: req.reqId, pieceId, options: [], probImproveOverall: 0, reason: "no-piece" }
  }

  const pool = attunementsFor(piece.slot, inputs.classId)
  if (pool.length === 0) {
    return { reqId: req.reqId, pieceId, options: [], probImproveOverall: 0, reason: "no-pool" }
  }

  const slotEmpty = inputsWithSlotEmpty(inputs, piece.slot)
  const equipDps = runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps

  const options: ReattunementOption[] = pool.map((opt) => {
    const inert = opt.enginePath === null
    const dpsAtMax = dpsWithAttunement(slotEmpty, piece, opt.id, opt.max)
    const dpsAtMin = dpsWithAttunement(slotEmpty, piece, opt.id, opt.min)
    return {
      optionId: opt.id,
      label: opt.label,
      min: opt.min,
      max: opt.max,
      deltaDpsAtMax: dpsAtMax - equipDps,
      probImproveGivenOption: probLinearImprove(dpsAtMin, dpsAtMax, equipDps, opt.min, opt.max),
      inert,
      isCurrent: piece.attunement === opt.id,
    }
  })

  const probImproveOverall =
    options.reduce((acc, o) => acc + o.probImproveGivenOption, 0) / options.length

  return { reqId: req.reqId, pieceId, options, probImproveOverall, reason: "ok" }
}

export interface WordMaxWorkerRequest {
  reqId: number
  inputs: Inputs
  piece: GearPiece
}

export interface WordMaxRow {
  slotIndex: number
  capValue: number
  unit: "raw" | "percent"
  deltaDps: number
  evaluated: boolean
}

export interface WordMaxWorkerResponse {
  reqId: number
  pieceId: string
  rows: WordMaxRow[]
}

function computeWordMax(req: WordMaxWorkerRequest): WordMaxWorkerResponse {
  const { inputs, piece } = req
  const specs = getWordSpecs(inputs)
  const specByWord = new Map(specs.map((s) => [s.word, s] as const))

  const slotEmpty = inputsWithSlotEmpty(inputs, piece.slot)
  const equipDps = runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps

  const rows: WordMaxRow[] = piece.words.map((w, slotIndex) => {
    if (!w.word) {
      return { slotIndex, capValue: 0, unit: "raw", deltaDps: 0, evaluated: false }
    }
    const spec = specByWord.get(w.word)
    if (!spec || !spec.amount) {
      return { slotIndex, capValue: 0, unit: "raw", deltaDps: 0, evaluated: false }
    }
    const capValue = relayedCapValue(spec.amount, spec.unit)
    const swappedWords = piece.words.map((cur, i) =>
      i === slotIndex ? { ...cur, value: capValue } : cur,
    ) as GearPiece["words"]
    const swapped: GearPiece = { ...piece, words: swappedWords }
    const dps = runEngine(applyPieceContribution(slotEmpty, swapped, +1)).dps
    return {
      slotIndex,
      capValue,
      unit: spec.unit,
      deltaDps: dps - equipDps,
      evaluated: true,
    }
  })

  return { reqId: req.reqId, pieceId: piece.id, rows }
}

export interface RankingWorkerRequest {
  reqId: number
  inputs: Inputs
  baselineDps: number
}

export interface RankingWorkerResponse {
  reqId: number
  rows: ItemRankingRow[]
}

function computeRankingRequest(req: RankingWorkerRequest): RankingWorkerResponse {
  return { reqId: req.reqId, rows: computeRanking(req.inputs, req.baselineDps) }
}

export interface SetTilesWorkerRequest {
  reqId: number
  inputs: Inputs
}

export interface SetTilesWorkerResponse {
  reqId: number
  armorDpsByKey: Record<string, number>
  bowDpsByChoice: { affinity: number; crit: number; precision: number; none: number }
  arsenalDpsByChoice: Record<string, number>
}

export interface GraduationWorkerRequest {
  reqId: number
  inputs: Inputs
  currentDps: number
}

export interface GraduationWorkerResponse {
  reqId: number
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
  graduationRate: number | null
}

function dpsFor(inputs: Inputs): number {
  const derived = withDerivedStats(inputs)
  return runEngine(applyBowSet(applyArmorSet(derived))).dps
}

const ARSENAL_CHOICES: Arsenal[] = ["general", "bellstrike", "stonesplit", "silkbind", "bamboocut"]

function computeSetTiles(req: SetTilesWorkerRequest): SetTilesWorkerResponse {
  const { inputs } = req

  const armorDpsByKey: Record<string, number> = { __none: dpsFor({ ...inputs, set: null }) }
  for (const opt of ARMOR_SET_OPTIONS) {
    armorDpsByKey[opt.setKey] = dpsFor({ ...inputs, set: opt.setKey })
  }

  const bowChoice = (choice: BowSet): number => dpsFor({ ...inputs, bowSet: choice })
  const bowDpsByChoice = {
    affinity: bowChoice("affinity"),
    crit: bowChoice("crit"),
    precision: bowChoice("precision"),
    none: bowChoice(null),
  }

  const arsenalDpsByChoice: Record<string, number> = {}
  for (const choice of ARSENAL_CHOICES) {
    arsenalDpsByChoice[choice] = dpsFor(swapArsenal(inputs, choice))
  }

  return { reqId: req.reqId, armorDpsByKey, bowDpsByChoice, arsenalDpsByChoice }
}

function computeGraduation(req: GraduationWorkerRequest): GraduationWorkerResponse {
  const benchmarkInputs = graduationInputs(req.inputs)
  const relayedInputs = graduationInputs(req.inputs, "relayed")
  if (!benchmarkInputs || !relayedInputs) {
    return {
      reqId: req.reqId,
      theoreticalDps: null,
      relayedTheoreticalDps: null,
      graduationRate: null,
    }
  }
  const theoreticalDps = dpsFor(benchmarkInputs)
  return {
    reqId: req.reqId,
    theoreticalDps,
    relayedTheoreticalDps: dpsFor(relayedInputs),
    graduationRate: theoreticalDps > 0 ? req.currentDps / theoreticalDps : null,
  }
}

export type WorkerRequest =
  | ({ kind: "dpsDeltas" } & DpsWorkerRequest)
  | ({ kind: "retunement" } & RetunementWorkerRequest)
  | ({ kind: "reattunement" } & ReattunementWorkerRequest)
  | ({ kind: "wordMax" } & WordMaxWorkerRequest)
  | ({ kind: "ranking" } & RankingWorkerRequest)
  | ({ kind: "setTiles" } & SetTilesWorkerRequest)
  | ({ kind: "graduation" } & GraduationWorkerRequest)

export type WorkerResponse =
  | ({ kind: "dpsDeltas" } & DpsWorkerResponse)
  | ({ kind: "retunement" } & RetunementWorkerResponse)
  | ({ kind: "reattunement" } & ReattunementWorkerResponse)
  | ({ kind: "wordMax" } & WordMaxWorkerResponse)
  | ({ kind: "ranking" } & RankingWorkerResponse)
  | ({ kind: "setTiles" } & SetTilesWorkerResponse)
  | ({ kind: "graduation" } & GraduationWorkerResponse)

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  if (req.kind === "dpsDeltas") {
    const res = computeDpsDeltas(req)
    ;(self as unknown as Worker).postMessage({ kind: "dpsDeltas", ...res })
  } else if (req.kind === "retunement") {
    const res = computeRetunement(req)
    ;(self as unknown as Worker).postMessage({ kind: "retunement", ...res })
  } else if (req.kind === "reattunement") {
    const res = computeReattunement(req)
    ;(self as unknown as Worker).postMessage({ kind: "reattunement", ...res })
  } else if (req.kind === "wordMax") {
    const res = computeWordMax(req)
    ;(self as unknown as Worker).postMessage({ kind: "wordMax", ...res })
  } else if (req.kind === "ranking") {
    const res = computeRankingRequest(req)
    ;(self as unknown as Worker).postMessage({ kind: "ranking", ...res })
  } else if (req.kind === "setTiles") {
    const res = computeSetTiles(req)
    ;(self as unknown as Worker).postMessage({ kind: "setTiles", ...res })
  } else {
    const res = computeGraduation(req)
    ;(self as unknown as Worker).postMessage({ kind: "graduation", ...res })
  }
}

export {
  computeDpsDeltas,
  computeRetunement,
  computeReattunement,
  computeWordMax,
  computeRankingRequest,
  computeSetTiles,
  computeGraduation,
}
