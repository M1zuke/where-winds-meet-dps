// One def per inner way that moves a context-level term.
//
// CALCULATION.md § "Mind-method layers" lists four disjoint channels an inner
// way can act through. This file is channel 2 (context scalars) and the
// all-damage part of channel 4; channel 1 stays in
// `mindMethodPanelStats.json`, channel 3 in `mindMethodOverrides.ts`, and the
// triggered part of channel 4 in the buff defs.
//
// Keyed by `innerWayId`, never by display name — a rename is a one-line change
// in `innerWayRegistry.ts` and nothing here moves.
import { resolveInnerWayId } from "./innerWayRegistry"

export interface InnerWayDef {
  innerWayId: string
  minTier?: number
  // Additive into `FormulaContext.generalDamageBoost`.
  generalDamageBoost?: number
  // Additive into `FormulaContext.chargeBonus`, which only charged skills read.
  chargeBonus?: number
  // The always-on DoT boost, superseded by a mechanic's `dotDamageMultiplier`.
  dotDamageBoost?: number
  // Flat all-damage the inner way grants merely by being selected (the site's
  // `Ss[key].allDamageBonus`, `zo()` ~L7743-65).
  allDamageBonus?: number
  // Multiplies the target's physical defense.
  targetDefenseMultiplier?: number
}

export const INNER_WAY_DEFS: readonly InnerWayDef[] = [
  { innerWayId: "insightfulStrike", dotDamageBoost: 0.1, allDamageBonus: 0.015 },
]

export interface SlottedInnerWay {
  name: string
  id?: string
  stacks: string
}

function tierOf(stacks: string): number {
  const match = /(\d+)/.exec(stacks ?? "")
  return match ? Number(match[1]) : 0
}

// A saved slot may still carry only a display name, so resolve either form.
export function slotInnerWayId(slot: SlottedInnerWay): string {
  return slot.id ?? resolveInnerWayId(slot.name)
}

export function activeInnerWayDefs(slots: readonly SlottedInnerWay[]): InnerWayDef[] {
  const out: InnerWayDef[] = []
  for (const def of INNER_WAY_DEFS) {
    const slot = slots.find((candidate) => slotInnerWayId(candidate) === def.innerWayId)
    if (!slot) continue
    if (def.minTier && tierOf(slot.stacks) < def.minTier) continue
    out.push(def)
  }
  return out
}

export function innerWayScalar(
  slots: readonly SlottedInnerWay[],
  channel: "generalDamageBoost" | "chargeBonus" | "dotDamageBoost" | "allDamageBonus",
): number {
  let total = 0
  for (const def of activeInnerWayDefs(slots)) total += def[channel] ?? 0
  return total
}

export function innerWayTargetDefenseMultiplier(slots: readonly SlottedInnerWay[]): number | null {
  for (const def of activeInnerWayDefs(slots))
    if (def.targetDefenseMultiplier !== undefined) return def.targetDefenseMultiplier
  return null
}

export function hasInnerWay(slots: readonly SlottedInnerWay[], innerWayId: string): boolean {
  return slots.some((slot) => slotInnerWayId(slot) === innerWayId)
}

export function innerWayTier(slots: readonly SlottedInnerWay[], innerWayId: string): number | null {
  const slot = slots.find((candidate) => slotInnerWayId(candidate) === innerWayId)
  return slot ? tierOf(slot.stacks) : null
}
