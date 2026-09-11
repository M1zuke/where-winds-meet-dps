import { runEngine } from "./dps"
import { applyPieceContribution, maxRelayedClone, relayedCapValue } from "./gearStats"
import { computeRanking, getWordSpecs } from "./itemRanking"
import { computeGearAnalysis, type GearSlotAnalysisRow } from "./gearAnalysis"
import { attributeForClass, poolForClass } from "../definitions/classes/registry"
import {
  annotatePoolForSlot,
  probLinearImprove,
  rerollableSlots,
  retuneLineOutcome,
  retunePoolChoices,
} from "./retunement"
import { retuneWeightPool, type RetuneLine } from "../data/stats/gearRetuneWeights"
import { GEAR_WORD_UNIT } from "../data/stats/statLines"
import { reattunementPool } from "../data/stats/gearReattunementWeights"
import {
  expectedFreshValue,
  expectedRedeterminedValue,
  reattunementDrawables,
  reattunementPityThreshold,
} from "./reattunement"
import { attunementMax, attunementMin, attunementsFor, attunementLabelKey } from "./attunements"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
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
import type { RetunementPool } from "../definitions/classes/classDef"
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
  SkillTickResult,
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
    const upgraded = maxRelayedClone(
      candidate,
      inputs,
      gearLevelForBreakthrough(inputs.breakthrough),
    )
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
  // null where no weighted pool exists yet for this gear level (86, 91).
  pDraw: number | null
  pImprove: number | null
  eDeltaDps: number | null
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

function retunementDpsHelpers(inputs: Inputs, piece: GearPiece) {
  const slotEmpty = inputsWithSlotEmpty(inputs, piece.slot)
  const equipDps = runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps
  const relayedPiece = maxRelayedClone(piece, inputs, piece.level)
  const relayedDps = runEngine(applyPieceContribution(slotEmpty, relayedPiece, +1)).dps

  const dpsWithWord = (from: GearPiece, slotIndex: number, word: GearWordId, value: number) => {
    const words = from.words.map((existing, index) =>
      index === slotIndex ? { word, value, retuned: true } : existing,
    ) as GearPiece["words"]
    return runEngine(applyPieceContribution(slotEmpty, { ...from, words }, +1)).dps
  }

  return { equipDps, relayedPiece, relayedDps, dpsWithWord }
}

function computeLegacyRetunement(
  req: RetunementWorkerRequest,
  piece: GearPiece,
  pool: RetunementPool,
): RetunementWorkerResponse {
  const { inputs, pieceId } = req
  const specs = getWordSpecs(inputs, piece.level)
  const specByWord = new Map(specs.map((s) => [s.word, s] as const))
  const rows: RetunementRow[] = []
  const slots = rerollableSlots(piece)
  const { equipDps, relayedPiece, relayedDps, dpsWithWord } = retunementDpsHelpers(inputs, piece)

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
          pDraw: null,
          pImprove: null,
          eDeltaDps: null,
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
          pDraw: null,
          pImprove: null,
          eDeltaDps: null,
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
        pDraw: null,
        pImprove: null,
        eDeltaDps: null,
      })
    }
  }

  return { reqId: req.reqId, pieceId, rows, reason: "ok" }
}

function computeWeightedRetunement(
  req: RetunementWorkerRequest,
  piece: GearPiece,
  weightPool: readonly RetuneLine[],
): RetunementWorkerResponse {
  const { inputs, pieceId } = req
  const rows: RetunementRow[] = []
  const slots = rerollableSlots(piece)
  const { equipDps, relayedPiece, relayedDps, dpsWithWord } = retunementDpsHelpers(inputs, piece)

  const choices = retunePoolChoices(piece, weightPool).filter(
    (choice) => !choice.deselected && !choice.onRerollableLine,
  )
  const lineByWord = new Map(weightPool.map((line) => [line.word, line] as const))

  for (const slotIndex of slots) {
    for (const { word, pDraw } of choices) {
      const line = lineByWord.get(word)
      if (!line) continue
      const outcome = retuneLineOutcome(line, piece.rarity, equipDps, (value) =>
        dpsWithWord(piece, slotIndex, word, value),
      )
      const maxValue = line.bands[2].max
      const relayedMaxValue = relayedCapValue(maxValue, GEAR_WORD_UNIT[word])
      rows.push({
        slotIndex,
        word,
        legal: true,
        isCurrent: false,
        deltaDps: dpsWithWord(piece, slotIndex, word, maxValue) - equipDps,
        deltaDpsRelayed: dpsWithWord(relayedPiece, slotIndex, word, relayedMaxValue) - relayedDps,
        poolSize: weightPool.length,
        pDraw,
        pImprove: outcome.pImprove,
        eDeltaDps: pDraw * outcome.eDeltaDpsGivenDrawn,
      })
    }
  }

  return { reqId: req.reqId, pieceId, rows, reason: "ok" }
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

  const attribute = attributeForClass(inputs.classId)
  const weightPool = attribute ? retuneWeightPool(attribute, piece.level, piece.slot) : null
  if (weightPool) return computeWeightedRetunement(req, piece, weightPool)

  const pool = poolForClass(inputs.classId)
  if (!pool || pool.stats.length === 0) {
    return { reqId: req.reqId, pieceId, rows: [], reason: "no-pool" }
  }
  return computeLegacyRetunement(req, piece, pool)
}

export interface ReattunementWorkerRequest {
  reqId: number
  inputs: Inputs
  pieceId: string
}

export interface ReattunementOption {
  optionId: string
  label: string
  labelKey: string
  min: number
  max: number
  deltaDpsAtMax: number
  probImproveGivenOption: number
  inert: boolean
  isCurrent: boolean
  // Null wherever the app has no pool data for this option — an unauthored
  // level/class/slot, or a pool member with no modelled engine effect. When
  // isCurrent is true, expectedValueIfDrawn comes from the monotone
  // re-determination of the held line; otherwise from an ordinary fresh roll.
  pDraw: number | null
  expectedValueIfDrawn: number | null
  eDeltaDpsGivenDrawn: number | null
  eDeltaDps: number | null
}

export interface ReattunementWorkerResponse {
  reqId: number
  pieceId: string
  options: ReattunementOption[]
  probImproveOverall: number
  eDeltaDpsOverall: number | null
  pityThreshold: number | null
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

function computeReattunement(req: ReattunementWorkerRequest): ReattunementWorkerResponse {
  const { inputs, pieceId } = req
  const piece = inputs.inventory.find((p) => p.id === pieceId)
  if (!piece) {
    return {
      reqId: req.reqId,
      pieceId,
      options: [],
      probImproveOverall: 0,
      eDeltaDpsOverall: null,
      pityThreshold: null,
      reason: "no-piece",
    }
  }

  const pool = attunementsFor(piece.slot, inputs.classId)
  if (pool.length === 0) {
    return {
      reqId: req.reqId,
      pieceId,
      options: [],
      probImproveOverall: 0,
      eDeltaDpsOverall: null,
      pityThreshold: null,
      reason: "no-pool",
    }
  }

  const slotEmpty = inputsWithSlotEmpty(inputs, piece.slot)
  const equipDps = runEngine(applyPieceContribution(slotEmpty, piece, +1)).dps

  const weightedPool = reattunementPool(inputs.classId, piece.slot, piece.level)
  const drawables = weightedPool
    ? reattunementDrawables(weightedPool, piece.attunement, piece.attunementValue)
    : []
  const drawableByOptionId = new Map(
    drawables.map((drawable) => [drawable.line.optionId, drawable] as const),
  )

  const options: ReattunementOption[] = pool.map((opt) => {
    const inert = opt.enginePath === null
    const min = attunementMin(opt, piece.level)
    const max = attunementMax(opt, piece.level)
    const dpsAtMax = dpsWithAttunement(slotEmpty, piece, opt.id, max)
    const dpsAtMin = dpsWithAttunement(slotEmpty, piece, opt.id, min)
    const isCurrent = piece.attunement === opt.id

    const line = weightedPool?.lines.find((candidate) => candidate.optionId === opt.id) ?? null
    const drawable = drawableByOptionId.get(opt.id) ?? null

    let pDraw: number | null = null
    let expectedValueIfDrawn: number | null = null
    let eDeltaDpsGivenDrawn: number | null = null
    if (line && drawable) {
      pDraw = drawable.pDraw
      expectedValueIfDrawn = drawable.isCurrentLine
        ? expectedRedeterminedValue(line, piece.attunementValue)
        : expectedFreshValue(line)
      eDeltaDpsGivenDrawn =
        dpsWithAttunement(slotEmpty, piece, opt.id, expectedValueIfDrawn) - equipDps
    } else if (line && isCurrent) {
      // Popped: the currently-held line is already at its maximum.
      pDraw = 0
      expectedValueIfDrawn = piece.attunementValue
      eDeltaDpsGivenDrawn = 0
    }

    return {
      optionId: opt.id,
      label: opt.label,
      labelKey: attunementLabelKey(opt, inputs.classId),
      min,
      max,
      deltaDpsAtMax: dpsAtMax - equipDps,
      probImproveGivenOption: probLinearImprove(dpsAtMin, dpsAtMax, equipDps, min, max),
      inert,
      isCurrent,
      pDraw,
      expectedValueIfDrawn,
      eDeltaDpsGivenDrawn,
      eDeltaDps:
        pDraw !== null && eDeltaDpsGivenDrawn !== null ? pDraw * eDeltaDpsGivenDrawn : null,
    }
  })

  const probImproveOverall =
    options.reduce((acc, o) => acc + o.probImproveGivenOption, 0) / options.length
  const eDeltaDpsOverall = weightedPool
    ? options.reduce((sum, option) => sum + (option.eDeltaDps ?? 0), 0)
    : null

  return {
    reqId: req.reqId,
    pieceId,
    options,
    probImproveOverall,
    eDeltaDpsOverall,
    pityThreshold: reattunementPityThreshold(piece.level),
    reason: "ok",
  }
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
  const specs = getWordSpecs(inputs, piece.level)
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
  index: number
  totalDamage: number
  dps: number
  abrasionHits: number
  normalHits: number
  criticalHits: number
  affinityHits: number
  abrasionDamage: number
  normalDamage: number
  criticalDamage: number
  affinityDamage: number
}

export function parseRunSeed(baseSeed: number, index: number): number {
  return (baseSeed + index * RUN_SEED_STRIDE) | 0
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
  seed: number
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
      seed: parseRunSeed(req.seed, index),
      collect: "totals",
    })
    const counts = result.outcomeCounts ?? NO_OUTCOMES
    const share = result.expectedOutcomeShare ?? NO_OUTCOMES
    for (const outcome of OUTCOME_KEYS) shareTotals[outcome] += share[outcome]
    if (index === 0) {
      warnings = result.warnings
      rotationDuration = result.rotationDuration
    }
    const outcomeDamage = result.outcomeDamage ?? NO_OUTCOMES
    runs.push({
      index,
      totalDamage: result.totalDamage,
      dps: result.dps,
      abrasionHits: counts.abrasion,
      normalHits: counts.normal,
      criticalHits: counts.crit,
      affinityHits: counts.affinity,
      abrasionDamage: outcomeDamage.abrasion,
      normalDamage: outcomeDamage.normal,
      criticalDamage: outcomeDamage.crit,
      affinityDamage: outcomeDamage.affinity,
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
    seed: req.seed,
    runs,
    expectedRates: runs.length > 0 ? expectedRates : null,
    rotationDuration,
    requestedRuns: total,
    completedRuns: runs.length,
    cancelled: runs.length < total,
    warnings,
  }
}

export interface ParseRunDetailWorkerRequest {
  reqId: number
  inputs: Inputs
  rotation: Rotation | null
  seed: number
}

export interface ParseRunDetailWorkerResponse {
  reqId: number
  seed: number
  totalDamage: number
  dps: number
  rotationDuration: number
  perSkill: SkillTickResult[]
  outcomeCounts: OutcomeCounts
  outcomeDamage: OutcomeCounts
}

function computeParseRunDetail(req: ParseRunDetailWorkerRequest): ParseRunDetailWorkerResponse {
  const result = runEngine(
    {
      ...req.inputs,
      activeCustomRotation: req.rotation,
      selectedBuiltinRotationId: null,
    },
    { seed: req.seed },
  )
  return {
    reqId: req.reqId,
    seed: req.seed,
    totalDamage: result.totalDamage,
    dps: result.dps,
    rotationDuration: result.rotationDuration,
    perSkill: result.perSkill,
    outcomeCounts: result.outcomeCounts ?? NO_OUTCOMES,
    outcomeDamage: result.outcomeDamage ?? NO_OUTCOMES,
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
  | ({ kind: "parseRunDetail" } & ParseRunDetailWorkerRequest)
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
  | ({ kind: "parseRunDetail" } & ParseRunDetailWorkerResponse)
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
  } else if (req.kind === "parseRunDetail") {
    const res = computeParseRunDetail(req)
    ;(self as unknown as Worker).postMessage({ kind: "parseRunDetail", ...res })
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
  computeParseRunDetail,
  computeGraduation,
}
