import { PASSIVE_ID_TO_INNER_WAY } from "../../../../data/innerWays/passiveIds"
import type { InnerWayDef } from "../../../../definitions/innerWays/innerWayDef"
import { innerWayDefinition, innerWayName } from "../../../../definitions/innerWays/registry"
import { allowedInnerWaysForClass, getSchool } from "../../../../engine/panel"
import type { Inputs, MindMethodSlot } from "../../../../engine/types"
import type { GearImportResult, ImportedInnerWay } from "./dashboardGearPayload"

export const MIND_METHOD_SLOT_COUNT = 4
const FALLBACK_TIER = 6

export type PassiveInnerWayMapping = Readonly<Record<string, string>>

function narrowedTier(
  def: InnerWayDef,
  reportedTier: number | null,
): { tier: number; assumed: boolean } {
  const selectable = def.selectableTiers.length ? def.selectableTiers : [FALLBACK_TIER]
  if (reportedTier === null) return { tier: Math.max(...selectable), assumed: true }
  if (selectable.includes(reportedTier)) return { tier: reportedTier, assumed: false }
  // The app models only the top of each ladder, so a lower reported tier lands on
  // the lowest one it models rather than being rounded up into a stronger build.
  const atOrBelow = selectable.filter((tier) => tier <= reportedTier)
  return {
    tier: atOrBelow.length ? Math.max(...atOrBelow) : Math.min(...selectable),
    assumed: true,
  }
}

export function resolveInnerWays(
  result: GearImportResult,
  inputs: Inputs,
  mapping: PassiveInnerWayMapping = PASSIVE_ID_TO_INNER_WAY,
): ImportedInnerWay[] {
  const allowed = new Set(allowedInnerWaysForClass(inputs.classId))
  return result.innerWays.map((innerWay) => {
    const innerWayId = mapping[innerWay.passiveId]
    const def = innerWayId ? innerWayDefinition(innerWayId) : undefined
    if (!innerWayId || !def) {
      return { ...innerWay, resolution: { kind: "unmapped" as const } }
    }
    const name = innerWayName(innerWayId)
    if (!allowed.has(innerWayId)) {
      return { ...innerWay, resolution: { kind: "notForThisClass" as const, innerWayId, name } }
    }
    const { tier, assumed } = narrowedTier(def, innerWay.reportedTier)
    return {
      ...innerWay,
      resolution: { kind: "resolved" as const, innerWayId, name, tier, tierAssumed: assumed },
    }
  })
}

export interface ImportableInnerWay {
  innerWayId: string
  tier: number
}

export function importableInnerWays(innerWays: readonly ImportedInnerWay[]): ImportableInnerWay[] {
  const taken = new Set<string>()
  const importable: ImportableInnerWay[] = []
  for (const innerWay of innerWays) {
    const resolution = innerWay.resolution
    if (resolution.kind !== "resolved") continue
    if (taken.has(resolution.innerWayId)) continue
    taken.add(resolution.innerWayId)
    importable.push({ innerWayId: resolution.innerWayId, tier: resolution.tier })
  }
  return importable
}

function slotFor(importable: ImportableInnerWay): MindMethodSlot {
  return {
    id: importable.innerWayId,
    name: innerWayName(importable.innerWayId),
    stacks: `tier ${importable.tier}`,
  }
}

/**
 * Null when the capture resolved nothing, so an import against an unfilled
 * mapping table leaves the slots the user set by hand alone.
 *
 * Slot 0 belongs to the class's own inner way (`syncClassPermanent`), so it takes
 * the capture's entry for that inner way if there is one and the current slot
 * otherwise — never one of the free inner ways.
 */
export function toMindMethods(
  innerWays: readonly ImportedInnerWay[],
  inputs: Inputs,
): Inputs["mindMethods"] | null {
  const importable = importableInnerWays(innerWays)
  if (!importable.length) return null

  const locked = getSchool(inputs.classId).classMindGroup
  const lockedImport = locked
    ? importable.find((candidate) => candidate.innerWayId === locked)
    : undefined
  const free = importable.filter((candidate) => candidate !== lockedImport)

  const slots: MindMethodSlot[] = []
  if (locked) slots.push(lockedImport ? slotFor(lockedImport) : inputs.mindMethods[0])
  for (const candidate of free) {
    if (slots.length === MIND_METHOD_SLOT_COUNT) break
    slots.push(slotFor(candidate))
  }
  while (slots.length < MIND_METHOD_SLOT_COUNT) slots.push({ name: "", stacks: "" })
  return slots as Inputs["mindMethods"]
}
