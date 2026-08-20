import { GEAR_SLOTS } from "../../engine/types"
import type { GearSlot } from "../../engine/types"
import type {
  DpsDelta,
  ProfileMetrics,
  WorkerRequest,
  WorkerResponse,
} from "../../engine/dpsWorker"

type DeltaResponse = Extract<WorkerResponse, { kind: "dpsDeltas" | "equippedDeltas" }>
type ProfileMetricsResponse = Extract<WorkerResponse, { kind: "profileMetrics" }>

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
  return null
}

export function mergeShardResponses(parts: readonly WorkerResponse[]): WorkerResponse {
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
