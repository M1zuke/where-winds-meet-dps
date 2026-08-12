import { PARAM } from "../../data/skills/buffs/ids"
import type { InnerWayNode } from "../../data/innerWays/ids"
import type { PanelStatPath } from "../../engine/gearStats"
import type { MechanicRegistration } from "../../engine/mechanics"
import type { Buff } from "../../engine/buff"
import type { BuffModule } from "../../engine/buffs/buffModule"
import type { DisplayGateRegistration } from "../../engine/buffs/displayGates"
import type { SkillBehaviorRegistration } from "../../engine/behavior"

type PanelStats = Readonly<Partial<Record<PanelStatPath, number>>>

export interface InnerWayTier {
  panelStats?: PanelStats
  nodes?: readonly InnerWayNode[]
}

// Channel 2 (context scalars) and the all-damage part of channel 3
// (CALCULATION.md § "Inner-way layers"). `minTier` gates the whole block,
// not an individual field.
export interface InnerWayScalars {
  minTier?: number
  generalDamageBoost?: number
  chargeBonus?: number
  // Superseded by a mechanic's `dotDamageMultiplier` when one is passed.
  dotDamageBoost?: number
  // The site's `Ss[key].allDamageBonus`, `zo()` ~L7743-65.
  allDamageBonus?: number
  targetDefenseMultiplier?: number
}

// An inner way is not owned by a class and must not name one — the class
// registry stamps `classId` onto each record when it composes a class's
// `builtinBuffsForClass` set from the inner ways that class can slot.
export type InnerWayGateBuff = Omit<Buff, "classId">

export function defineInnerWayGateBuff<const T extends InnerWayGateBuff>(buff: T): T {
  return buff
}

export interface InnerWayDef {
  id: string
  name: string
  // Display names this inner way has shipped under before. A saved slot that
  // stored one still resolves to this id — the standing invariant behind the
  // rename migrations, covering the two paths that never walk the chain.
  legacyNames?: readonly string[]
  selectableTiers: readonly number[]
  // The reference site's param this inner way turns on when selected —
  // undefined for one that is deliberately never mapped (see
  // `insightfulStrike.ts`).
  buffParam?: (typeof PARAM)[keyof typeof PARAM]
  // Channel 1 (CALCULATION.md § "Inner-way layers"): granted merely by being
  // slotted, no tier check. `tiers` is its per-tier extension, applying once
  // the slotted stack count reaches that tier.
  panelStats?: PanelStats
  tiers?: Readonly<Record<number, InnerWayTier>>
  scalars?: InnerWayScalars
  mechanics?: readonly MechanicRegistration[]
  // Folded into every slotting class by the class registry; the two below
  // register directly instead — CLASSES.md § "One definition per class".
  gateBuffs?: readonly InnerWayGateBuff[]
  buffDefs?: readonly BuffModule[]
  displayGates?: readonly DisplayGateRegistration[]
  skillBehaviors?: readonly SkillBehaviorRegistration[]
}

export function defineInnerWay<const T extends InnerWayDef>(def: T): T {
  return def
}

// The stored `"tier N"` format is a persisted `MindMethodSlot.stacks` value —
// do not change its shape to a number.
export function tierFromStacks(stacks: string): number {
  const match = /(\d+)/.exec(stacks ?? "")
  return match ? Number(match[1]) : 0
}

// Resolves against `def` directly, without going through
// `definitions/innerWays/registry.ts` — a mechanic module declared under
// `src/data/innerWays/` is loaded AS PART OF that registry's own barrel
// import, so importing the registry back from the mechanic reopens the very
// cycle the hoisted-factory module shape exists to avoid. Matches on both
// `id` and `name` because a saved slot may carry only the display name.
export function slottedInnerWayTier(
  slots: readonly { id?: string; name: string; stacks: string }[],
  def: InnerWayDef,
): number | null {
  const slot = slots.find(
    (candidate) => (candidate.id ?? candidate.name) === def.id || candidate.name === def.name,
  )
  return slot ? tierFromStacks(slot.stacks) : null
}

// Undefined for a node no tier of this def declares — the "every
// `INNER_WAY_NODE` value is owned by exactly one def" case in
// `tests/data/innerWays.test.ts` is what keeps that from happening silently.
export function innerWayNodeTier(def: InnerWayDef, node: InnerWayNode): number | undefined {
  if (!def.tiers) return undefined
  let lowest: number | undefined
  for (const [tierKey, tier] of Object.entries(def.tiers)) {
    if (!tier.nodes?.includes(node)) continue
    const tierNumber = Number(tierKey)
    if (lowest === undefined || tierNumber < lowest) lowest = tierNumber
  }
  return lowest
}

export function innerWayHasNode(def: InnerWayDef, tier: number, node: InnerWayNode): boolean {
  const unlockTier = innerWayNodeTier(def, node)
  return unlockTier !== undefined && tier >= unlockTier
}

// For a call site feeding a serialized gate field rather than a live tier
// comparison, where `undefined` would silently ungate the def instead of
// crashing. The throw only fires eagerly for an eager caller: deferred behind a
// getter or an `effects` closure it surfaces inside the buff engine, which the
// timeline catches — silently disabling the engine rather than crashing loudly.
// The real guard against a dropped node is the one-owner pin in
// `tests/data/innerWays.test.ts`, not this throw.
export function requireInnerWayNodeTier(def: InnerWayDef, node: InnerWayNode): number {
  const tier = innerWayNodeTier(def, node)
  if (tier === undefined) throw new Error(`${def.id} declares no tier for node "${node}"`)
  return tier
}
