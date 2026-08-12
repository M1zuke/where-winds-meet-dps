import type { Inputs } from "../../engine/types"
import { tierFromStacks, type InnerWayDef } from "./innerWayDef"
import { INNER_WAYS } from "../../data/innerWays"
import { registerMechanic } from "../../engine/mechanics"
import { registerDisplayGate } from "../../engine/buffs/displayGates"
import { registerSkillBehavior } from "../../engine/behavior"
import { setInnerWayDefs } from "./defStore"

export { INNER_WAYS }

for (const def of INNER_WAYS) {
  for (const { mechanic, order } of def.mechanics ?? []) registerMechanic(mechanic, order)
  for (const { defId, predicate } of def.displayGates ?? []) registerDisplayGate(defId, predicate)
  for (const { skillId, factory } of def.skillBehaviors ?? [])
    registerSkillBehavior(skillId, factory)
}

setInnerWayDefs(INNER_WAYS)

export function innerWayDefinition(id: string): InnerWayDef | undefined {
  return INNER_WAYS.find((def) => def.id === id)
}

// Ids are stable identifiers, NOT translation keys: the UI renders
// `innerWayName(id)` through i18n, so the display name stays the translated
// string it always was.
export function innerWayName(id: string): string {
  return innerWayDefinition(id)?.name ?? id
}

export function innerWayIdForName(name: string): string | null {
  const def =
    INNER_WAYS.find((candidate) => candidate.name === name) ??
    INNER_WAYS.find((candidate) => candidate.legacyNames?.includes(name))
  return def?.id ?? null
}

// Accepts either, so a saved slot healed to an id and one still carrying a name
// resolve the same way.
export function resolveInnerWayId(nameOrId: string): string {
  if (!nameOrId) return ""
  if (innerWayDefinition(nameOrId)) return nameOrId
  return innerWayIdForName(nameOrId) ?? nameOrId
}

export function innerWayForBuffParam(param: string): InnerWayDef | undefined {
  return INNER_WAYS.find((def) => def.buffParam === param)
}

export interface SlottedInnerWay {
  name: string
  id?: string
  stacks: string
}

export function slotInnerWayId(slot: SlottedInnerWay): string {
  return slot.id ?? resolveInnerWayId(slot.name)
}

// Iterates in barrel order — see `INNER_WAYS`'s own comment
// (`src/data/innerWays/index.ts`) for why that order is load-bearing here.
export function activeInnerWayDefs(slots: readonly SlottedInnerWay[]): InnerWayDef[] {
  const out: InnerWayDef[] = []
  for (const def of INNER_WAYS) {
    if (!def.scalars) continue
    const slot = slots.find((candidate) => slotInnerWayId(candidate) === def.id)
    if (!slot) continue
    if (def.scalars.minTier && tierFromStacks(slot.stacks) < def.scalars.minTier) continue
    out.push(def)
  }
  return out
}

export function innerWayScalar(
  slots: readonly SlottedInnerWay[],
  channel: "generalDamageBoost" | "chargeBonus" | "dotDamageBoost" | "allDamageBonus",
): number {
  let total = 0
  for (const def of activeInnerWayDefs(slots)) total += def.scalars?.[channel] ?? 0
  return total
}

export function innerWayTargetDefenseMultiplier(slots: readonly SlottedInnerWay[]): number | null {
  for (const def of activeInnerWayDefs(slots)) {
    const multiplier = def.scalars?.targetDefenseMultiplier
    if (multiplier !== undefined) return multiplier
  }
  return null
}

export function henZhiActiveForInputs(inputs: Inputs): boolean {
  return inputs.shareDebuff5HenZhi || innerWayTargetDefenseMultiplier(inputs.mindMethods) !== null
}

export function hasInnerWay(slots: readonly SlottedInnerWay[], innerWayId: string): boolean {
  return slots.some((slot) => slotInnerWayId(slot) === innerWayId)
}

export function innerWayTier(slots: readonly SlottedInnerWay[], innerWayId: string): number | null {
  const slot = slots.find((candidate) => slotInnerWayId(candidate) === innerWayId)
  return slot ? tierFromStacks(slot.stacks) : null
}
