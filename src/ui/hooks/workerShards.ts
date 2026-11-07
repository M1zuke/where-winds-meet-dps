import { GEAR_SLOTS } from "../../engine/types"
import type { GearSlot } from "../../engine/types"
import type { GearSlotAnalysisRow } from "../../engine/gearAnalysis"
import { withLeadVsMin } from "../../engine/itemRanking"
import { OUTCOME_KEYS, PARSE_RUN_CAP } from "../../engine/dpsWorker"
import type {
  DpsDelta,
  ExpectedOutcomeRates,
  ProfileMetrics,
  WorkerRequest,
  WorkerResponse,
} from "../../engine/dpsWorker"

type ParseSimulationResponse = Extract<WorkerResponse, { kind: "parseSimulation" }>
type DeltaResponse = Extract<WorkerResponse, { kind: "dpsDeltas" | "equippedDeltas" }>
type ProfileMetricsResponse = Extract<WorkerResponse, { kind: "profileMetrics" }>
type RankingResponse = Extract<WorkerResponse, { kind: "ranking" }>
type GearAnalysisResponse = Extract<WorkerResponse, { kind: "gearAnalysis" }>

function slotGroups<Item>(
  items: readonly Item[],
  slotOf: (item: Item) => GearSlot | null,
  groupCount: number,
): Item[][] {
  const bySlot = new Map<GearSlot, Item[]>()
  for (const item of items) {
    const slot = slotOf(item)
    if (slot === null) continue
    const group = bySlot.get(slot)
    if (group) group.push(item)
    else bySlot.set(slot, [item])
  }
  const groups: Item[][] = Array.from({ length: Math.min(groupCount, bySlot.size) }, () => [])
  if (groups.length === 0) return []
  let next = 0
  for (const group of bySlot.values()) {
    groups[next % groups.length].push(...group)
    next++
  }
  return groups
}

export function shardRequest(request: WorkerRequest, shardCount: number): WorkerRequest[] | null {
  if (shardCount < 2) return null
  if (request.kind === "equippedDeltas") {
    const equippedSlots = GEAR_SLOTS.filter((slot) => request.inputs.equipped[slot] !== null)
    const groups = slotGroups(equippedSlots, (slot) => slot, shardCount)
    if (groups.length < 2) return null
    return groups.map((slots) => ({ ...request, slots }))
  }
  if (request.kind === "dpsDeltas") {
    const slotById = new Map(request.inputs.inventory.map((piece) => [piece.id, piece.slot]))
    const groups = slotGroups(request.pieceIds, (id) => slotById.get(id) ?? null, shardCount)
    if (groups.length < 2) return null
    return groups.map((pieceIds) => ({ ...request, pieceIds }))
  }
  if (request.kind === "profileMetrics") {
    if (request.profiles.length < 2) return null
    const groups = Array.from(
      { length: Math.min(shardCount, request.profiles.length) },
      (): typeof request.profiles => [],
    )
    request.profiles.forEach((profile, index) => groups[index % groups.length].push(profile))
    return groups.map((profiles) => ({ ...request, profiles }))
  }
  if (request.kind === "gearAnalysis") {
    const equippedSlots = GEAR_SLOTS.filter((slot) => request.inputs.equipped[slot] !== null)
    const groups = slotGroups(equippedSlots, (slot) => slot, shardCount)
    if (groups.length < 2) return null
    const emptySlots = GEAR_SLOTS.filter((slot) => request.inputs.equipped[slot] === null)
    groups[0].push(...emptySlots)
    return groups.map((slots, index) => ({ ...request, slots, skipAllSlotsLoss: index > 0 }))
  }
  if (request.kind === "ranking") {
    return Array.from({ length: shardCount }, (_, index) => ({
      ...request,
      block: { index, count: shardCount },
    }))
  }
  if (request.kind === "parseSimulation") {
    if (request.runRange) return null
    const total = Math.max(1, Math.min(Math.round(request.runs), PARSE_RUN_CAP))
    const shardTotal = Math.min(shardCount, total)
    if (shardTotal < 2) return null
    const baseSize = Math.floor(total / shardTotal)
    const largerShards = total % shardTotal
    let start = 0
    return Array.from({ length: shardTotal }, (_, index) => {
      const end = start + baseSize + (index < largerShards ? 1 : 0)
      const runRange = { start, end }
      start = end
      return { ...request, runRange }
    })
  }
  return null
}

function mergeParseSimulation(parts: readonly ParseSimulationResponse[]): WorkerResponse {
  const runs = parts.flatMap((part) => part.runs)
  const shares = parts.flatMap((part) => part.outcomeShares ?? [])
  let expectedRates: ExpectedOutcomeRates | null = null
  if (runs.length > 0) {
    const shareTotals: ExpectedOutcomeRates = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    for (const share of shares)
      for (const outcome of OUTCOME_KEYS) shareTotals[outcome] += share[outcome]
    expectedRates = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    for (const outcome of OUTCOME_KEYS) expectedRates[outcome] = shareTotals[outcome] / runs.length
  }
  const merged = {
    ...parts[0],
    runs,
    expectedRates,
    completedRuns: runs.length,
    cancelled: runs.length < parts[0].requestedRuns,
  }
  delete merged.outcomeShares
  return merged
}

export function mergeShardResponses(parts: readonly WorkerResponse[]): WorkerResponse {
  if (parts[0].kind === "parseSimulation")
    return mergeParseSimulation(parts as readonly ParseSimulationResponse[])
  if (parts[0].kind === "ranking") {
    const rows = parts.flatMap((part) => (part as RankingResponse).rows)
    return { ...(parts[0] as RankingResponse), rows: withLeadVsMin(rows) }
  }
  if (parts[0].kind === "gearAnalysis") {
    const rowBySlot = new Map<GearSlot, GearSlotAnalysisRow>()
    for (const part of parts)
      for (const row of (part as GearAnalysisResponse).rows) rowBySlot.set(row.slot, row)
    const rows = GEAR_SLOTS.map((slot) => rowBySlot.get(slot) as GearSlotAnalysisRow)
    const allSlotsLoss =
      parts
        .map((part) => (part as GearAnalysisResponse).allSlotsLoss)
        .find((loss) => loss !== null) ?? null
    return { ...(parts[0] as GearAnalysisResponse), rows, allSlotsLoss }
  }
  if (parts[0].kind === "profileMetrics") {
    const metricsByProfileId: Record<string, ProfileMetrics> = {}
    for (const part of parts)
      Object.assign(metricsByProfileId, (part as ProfileMetricsResponse).metricsByProfileId)
    return { ...(parts[0] as ProfileMetricsResponse), metricsByProfileId }
  }
  const deltas: Record<string, DpsDelta> = {}
  for (const part of parts) Object.assign(deltas, (part as DeltaResponse).deltas)
  return { ...(parts[0] as DeltaResponse), deltas }
}
