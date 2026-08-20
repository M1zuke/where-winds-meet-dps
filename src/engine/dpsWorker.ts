import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone, relayedCapValue } from "./gearStats"
import { computeRanking, getWordSpecs } from "./itemRanking"
import { computeGearAnalysis, type GearSlotAnalysisRow } from "./gearAnalysis"
import { poolForClass } from "../definitions/classes/registry"
import { annotatePoolForSlot, rerollableSlots } from "./retunement"
import { attunementsFor } from "./attunements"
import { ftDpsWhenEquipped, ftDpsWithSlotEmpty } from "./fullPotential"
import { withCustomContent } from "./customContent"
import { withDerivedStats } from "./derivedInputs"
import {
  applyArmorSet,
  applyBowSet,
  ARMOR_SET_OPTIONS,
  defaultArsenalForClass,
  swapArsenal,
} from "./panel"
import { graduationInputs } from "./graduation"
import type { Rotation } from "./rotation"
import type { Skill } from "./skill"
import type { Buff } from "./buff"
import type { Debuff } from "./debuff"
import { RUN_SEED_STRIDE } from "./rng"
import type { HitOutcome } from "./formula"
import { GEAR_SLOTS } from "./types"
import type {
  Arsenal,
  BowSet,
  GearPiece,
  GearSlot,
  GearWordId,
  Inputs,
  ItemRankingRow,
  OutcomeCounts,
} from "./types"

const OUTCOME_KEYS: readonly HitOutcome[] = ["abrasion", "normal", "crit", "affinity"]

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
}

export interface DpsWorkerResponse {
  reqId: number
  deltas: Record<string, DpsDelta>
}

export interface EquippedDeltasWorkerRequest {
  reqId: number
  inputs: Inputs
  baselineDps: number
  slots?: readonly GearSlot[]
}

export interface EquippedDeltasWorkerResponse {
  reqId: number
  deltas: Record<string, DpsDelta>
}

function dpsForSwap(unequippedBaseline: Inputs, candidate: GearPiece): number {
  const next = applyPieceContribution(unequippedBaseline, candidate, +1)
  return runEngine(next).dps
}

function equippedPieceIds(inputs: Inputs, slots: readonly GearSlot[]): string[] {
  const inInventory = new Set(inputs.inventory.map((piece) => piece.id))
  return slots
    .map((slot) => inputs.equipped[slot])
    .filter((pieceId): pieceId is string => pieceId !== null && inInventory.has(pieceId))
}

function computeEquippedDeltas(req: EquippedDeltasWorkerRequest): EquippedDeltasWorkerResponse {
  const { reqId, inputs, baselineDps, slots } = req
  const pieceIds = equippedPieceIds(inputs, slots ?? GEAR_SLOTS)
  return computeDpsDeltas({ reqId, inputs, baselineDps, pieceIds })
}

function computeDpsDeltas(req: DpsWorkerRequest): DpsWorkerResponse {
  const { inputs, baselineDps, pieceIds } = req
  const out: Record<string, DpsDelta> = {}
  const byId = new Map<string, GearPiece>()
  for (const piece of inputs.inventory) byId.set(piece.id, piece)

  const ftDpsByPieceId = new Map<string, number>()
  function ftDpsFor(piece: GearPiece): number {
    const known = ftDpsByPieceId.get(piece.id)
    if (known !== undefined) return known
    const ftDps = ftDpsWhenEquipped(piece, inputs)
    ftDpsByPieceId.set(piece.id, ftDps)
    return ftDps
  }

  const ftRefBySlot = new Map<GearSlot, number>()
  function ftReferenceForSlot(slot: GearSlot): number {
    const cached = ftRefBySlot.get(slot)
    if (cached !== undefined) return cached
    const equippedId = inputs.equipped[slot]
    const equipped = equippedId ? (byId.get(equippedId) ?? null) : null
    const ref = equipped ? ftDpsFor(equipped) : ftDpsWithSlotEmpty(slot, inputs)
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

    const ftCandidateDps = ftDpsFor(candidate)
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
  word: GearWordId
  legal: boolean
  isCurrent: boolean
  deltaDps: number
  // The same swap with every word on the piece — the candidate included —
  // relayed to its 94 % cap, measured against that same relayed piece.
  deltaDpsRelayed: number
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
  const relayedPiece = maxRelayedClone(piece, inputs)
  const relayedDps = runEngine(applyPieceContribution(slotEmpty, relayedPiece, +1)).dps

  const dpsWithWord = (from: GearPiece, slotIndex: number, word: GearWordId, value: number) => {
    const words = from.words.map((existing, index) =>
      index === slotIndex ? { word, value, retuned: true } : existing,
    ) as GearPiece["words"]
    return runEngine(applyPieceContribution(slotEmpty, { ...from, words }, +1)).dps
  }

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
          deltaDpsRelayed: 0,
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
          deltaDpsRelayed: 0,
          poolSize: pool.stats.length,
        })
        continue
      }
      const cappedValue = relayedCapValue(spec.amount, spec.unit)
      rows.push({
        slotIndex,
        word,
        legal: true,
        isCurrent,
        deltaDps: dpsWithWord(piece, slotIndex, word, spec.amount) - equipDps,
        deltaDpsRelayed: dpsWithWord(relayedPiece, slotIndex, word, cappedValue) - relayedDps,
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

export interface GearAnalysisWorkerRequest {
  reqId: number
  inputs: Inputs
  baselineDps: number
}

export interface GearAnalysisWorkerResponse {
  reqId: number
  rows: GearSlotAnalysisRow[]
}

function computeGearAnalysisRequest(req: GearAnalysisWorkerRequest): GearAnalysisWorkerResponse {
  return { reqId: req.reqId, rows: computeGearAnalysis(req.inputs, req.baselineDps) }
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

export interface RotationDpsWorkerRequest {
  reqId: number
  inputs: Inputs
  options: { optionId: string; rotation: Rotation | null }[]
}

export interface RotationDpsWorkerResponse {
  reqId: number
  dpsByOptionId: Record<string, number>
}

function computeRotationDps(req: RotationDpsWorkerRequest): RotationDpsWorkerResponse {
  const dpsByOptionId: Record<string, number> = {}
  for (const { optionId, rotation } of req.options) {
    dpsByOptionId[optionId] = runEngine({
      ...req.inputs,
      activeCustomRotation: rotation,
      selectedBuiltinRotationId: null,
    }).dps
  }
  return { reqId: req.reqId, dpsByOptionId }
}

export const PARSE_RUN_CAP = 10_000
const PARSE_TARGET_CHUNK_MS = 60
const MAX_CHUNK_RUNS = 200

export interface ParseRun {
  totalDamage: number
  dps: number
  abrasionHits: number
  normalHits: number
  criticalHits: number
  affinityHits: number
}

export type ExpectedOutcomeRates = OutcomeCounts

export interface ParseSimulationWorkerRequest {
  reqId: number
  inputs: Inputs
  rotation: Rotation | null
  runs: number
  seed: number
}

export interface ParseSimulationWorkerResponse {
  reqId: number
  runs: ParseRun[]
  expectedRates: ExpectedOutcomeRates | null
  rotationDuration: number
  requestedRuns: number
  completedRuns: number
  cancelled: boolean
  warnings: string[]
}

export interface ParseSimulationProgressResponse {
  reqId: number
  done: number
  total: number
}

export interface ParseSimulationCancelRequest {
  reqId: number
}

const NO_OUTCOMES: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }

async function computeParseSimulation(
  req: ParseSimulationWorkerRequest,
  onProgress?: (done: number, total: number) => void,
  isCancelled?: () => boolean,
): Promise<ParseSimulationWorkerResponse> {
  const total = Math.max(1, Math.min(Math.round(req.runs), PARSE_RUN_CAP))
  const runInputs: Inputs = {
    ...req.inputs,
    activeCustomRotation: req.rotation,
    selectedBuiltinRotationId: null,
  }

  const runs: ParseRun[] = []
  const shareTotals: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
  let warnings: string[] = []
  let rotationDuration = 0

  const runOnce = (index: number): void => {
    const result = runEngine(runInputs, {
      seed: (req.seed + index * RUN_SEED_STRIDE) | 0,
      collect: "totals",
    })
    const counts = result.outcomeCounts ?? NO_OUTCOMES
    const share = result.expectedOutcomeShare ?? NO_OUTCOMES
    for (const outcome of OUTCOME_KEYS) shareTotals[outcome] += share[outcome]
    if (index === 0) {
      warnings = result.warnings
      rotationDuration = result.rotationDuration
    }
    runs.push({
      totalDamage: result.totalDamage,
      dps: result.dps,
      abrasionHits: counts.abrasion,
      normalHits: counts.normal,
      criticalHits: counts.crit,
      affinityHits: counts.affinity,
    })
  }

  const startedAt = performance.now()
  runOnce(0)
  const msPerRun = Math.max(performance.now() - startedAt, 0.01)
  const chunkRuns = Math.max(
    1,
    Math.min(Math.round(PARSE_TARGET_CHUNK_MS / msPerRun), MAX_CHUNK_RUNS),
  )

  while (runs.length < total) {
    if (isCancelled?.()) break
    const chunkEnd = Math.min(runs.length + chunkRuns, total)
    for (let index = runs.length; index < chunkEnd; index++) runOnce(index)
    onProgress?.(runs.length, total)
    // A synchronous loop never lets `onmessage` fire, so without this yield no
    // cancel is ever read.
    if (runs.length < total) await new Promise((resolve) => setTimeout(resolve, 0))
  }

  const expectedRates: ExpectedOutcomeRates = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
  for (const outcome of OUTCOME_KEYS) expectedRates[outcome] = shareTotals[outcome] / runs.length

  return {
    reqId: req.reqId,
    runs,
    expectedRates: runs.length > 0 ? expectedRates : null,
    rotationDuration,
    requestedRuns: total,
    completedRuns: runs.length,
    cancelled: runs.length < total,
    warnings,
  }
}

export interface ProfileMetricsWorkerRequest {
  reqId: number
  profiles: { id: string; inputs: Inputs }[]
  customSkills: Skill[]
  customBuffs: Buff[]
  customDebuffs: Debuff[]
}

export interface ProfileMetrics {
  dps: number
  totalDamage: number
  rotationDuration: number
}

export interface ProfileMetricsWorkerResponse {
  reqId: number
  metricsByProfileId: Record<string, ProfileMetrics>
}

function computeProfileMetrics(req: ProfileMetricsWorkerRequest): ProfileMetricsWorkerResponse {
  const metricsByProfileId: Record<string, ProfileMetrics> = {}
  for (const { id, inputs } of req.profiles) {
    const configured = withCustomContent(
      inputs,
      req.customSkills,
      req.customBuffs,
      req.customDebuffs,
    )
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(configured))))
    metricsByProfileId[id] = {
      dps: result.dps,
      totalDamage: result.totalDamage,
      rotationDuration: result.rotationDuration,
    }
  }
  return { reqId: req.reqId, metricsByProfileId }
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

  const arsenalChoices = new Set<Arsenal>([
    "general",
    defaultArsenalForClass(inputs.classId),
    inputs.arsenal,
  ])
  const arsenalDpsByChoice: Record<string, number> = {}
  for (const choice of arsenalChoices) {
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
  | ({ kind: "equippedDeltas" } & EquippedDeltasWorkerRequest)
  | ({ kind: "retunement" } & RetunementWorkerRequest)
  | ({ kind: "reattunement" } & ReattunementWorkerRequest)
  | ({ kind: "wordMax" } & WordMaxWorkerRequest)
  | ({ kind: "ranking" } & RankingWorkerRequest)
  | ({ kind: "gearAnalysis" } & GearAnalysisWorkerRequest)
  | ({ kind: "setTiles" } & SetTilesWorkerRequest)
  | ({ kind: "rotationDps" } & RotationDpsWorkerRequest)
  | ({ kind: "profileMetrics" } & ProfileMetricsWorkerRequest)
  | ({ kind: "parseSimulation" } & ParseSimulationWorkerRequest)
  | ({ kind: "parseSimulationCancel" } & ParseSimulationCancelRequest)
  | ({ kind: "graduation" } & GraduationWorkerRequest)

export type WorkerResponse =
  | ({ kind: "dpsDeltas" } & DpsWorkerResponse)
  | ({ kind: "equippedDeltas" } & EquippedDeltasWorkerResponse)
  | ({ kind: "retunement" } & RetunementWorkerResponse)
  | ({ kind: "reattunement" } & ReattunementWorkerResponse)
  | ({ kind: "wordMax" } & WordMaxWorkerResponse)
  | ({ kind: "ranking" } & RankingWorkerResponse)
  | ({ kind: "gearAnalysis" } & GearAnalysisWorkerResponse)
  | ({ kind: "setTiles" } & SetTilesWorkerResponse)
  | ({ kind: "rotationDps" } & RotationDpsWorkerResponse)
  | ({ kind: "profileMetrics" } & ProfileMetricsWorkerResponse)
  | ({ kind: "parseSimulation" } & ParseSimulationWorkerResponse)
  | ({ kind: "parseSimulationProgress" } & ParseSimulationProgressResponse)
  | ({ kind: "graduation" } & GraduationWorkerResponse)

const cancelledReqIds = new Set<number>()

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  if (req.kind === "dpsDeltas") {
    const res = computeDpsDeltas(req)
    ;(self as unknown as Worker).postMessage({ kind: "dpsDeltas", ...res })
  } else if (req.kind === "equippedDeltas") {
    const res = computeEquippedDeltas(req)
    ;(self as unknown as Worker).postMessage({ kind: "equippedDeltas", ...res })
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
  } else if (req.kind === "gearAnalysis") {
    const res = computeGearAnalysisRequest(req)
    ;(self as unknown as Worker).postMessage({ kind: "gearAnalysis", ...res })
  } else if (req.kind === "setTiles") {
    const res = computeSetTiles(req)
    ;(self as unknown as Worker).postMessage({ kind: "setTiles", ...res })
  } else if (req.kind === "rotationDps") {
    const res = computeRotationDps(req)
    ;(self as unknown as Worker).postMessage({ kind: "rotationDps", ...res })
  } else if (req.kind === "profileMetrics") {
    const res = computeProfileMetrics(req)
    ;(self as unknown as Worker).postMessage({ kind: "profileMetrics", ...res })
  } else if (req.kind === "parseSimulationCancel") {
    cancelledReqIds.add(req.reqId)
  } else if (req.kind === "parseSimulation") {
    void computeParseSimulation(
      req,
      (done, total) =>
        (self as unknown as Worker).postMessage({
          kind: "parseSimulationProgress",
          reqId: req.reqId,
          done,
          total,
        }),
      () => cancelledReqIds.has(req.reqId),
    ).then((res) => {
      cancelledReqIds.delete(req.reqId)
      ;(self as unknown as Worker).postMessage({ kind: "parseSimulation", ...res })
    })
  } else {
    const res = computeGraduation(req)
    ;(self as unknown as Worker).postMessage({ kind: "graduation", ...res })
  }
}

export {
  computeDpsDeltas,
  computeEquippedDeltas,
  computeRetunement,
  computeReattunement,
  computeWordMax,
  computeRankingRequest,
  computeGearAnalysisRequest,
  computeSetTiles,
  computeRotationDps,
  computeProfileMetrics,
  computeParseSimulation,
  computeGraduation,
}
