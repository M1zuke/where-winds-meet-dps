import { PARAM } from "../../data/skills/buffs/ids"
import type { InnerWayNode } from "../../data/innerWays/ids"
import type { PanelStatPath } from "../../engine/gearStats"
import type { MechanicRegistration } from "../../engine/mechanics"

type PanelStats = Readonly<Partial<Record<PanelStatPath, number>>>

export interface InnerWayTier {
  panelStats?: PanelStats
  nodes?: readonly InnerWayNode[]
}

// Channel 2 (context scalars) and the all-damage part of channel 3
// (CALCULATION.md § "Mind-method layers"). `minTier` gates the whole block,
// not an individual field.
export interface InnerWayScalars {
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

export interface InnerWayDef {
  id: string
  name: string
  selectableTiers: readonly number[]
  // The reference site's param this inner way turns on when selected —
  // undefined for one that is deliberately never mapped (see
  // `insightfulStrike.ts`).
  buffParam?: (typeof PARAM)[keyof typeof PARAM]
  // Channel 1 (CALCULATION.md § "Mind-method layers"): granted merely by
  // being slotted, no tier check.
  panelStats?: PanelStats
  // Channel 1's per-tier extension — a tier entry's `panelStats` applies once
  // the slotted stack count reaches that tier. Most inner ways have none; only
  // Bitter Season's source data carries a tier dimension here.
  tiers?: Readonly<Record<number, InnerWayTier>>
  scalars?: InnerWayScalars
  mechanics?: readonly MechanicRegistration[]
}

// Thin on purpose, like `defineClass`/`defineSet`: it exists so TypeScript
// checks each literal at its definition site, and the `const` type parameter
// keeps the literal `id`/`buffParam` narrow.
export function defineInnerWay<const T extends InnerWayDef>(def: T): T {
  return def
}

// The stored `"tier N"` format is a persisted `MindMethodSlot.stacks` value —
// do not change its shape to a number.
export function tierFromStacks(stacks: string): number {
  const match = /(\d+)/.exec(stacks ?? "")
  return match ? Number(match[1]) : 0
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

// For a call site that feeds a persisted/serialized field (a `requires.minTier`,
// a debuff's `retainMinTier`) rather than a live tier comparison: `undefined`
// there doesn't crash, it silently ungates the def or lets it apply at every
// tier. Throwing turns a dropped node into a load-time failure instead.
export function requireInnerWayNodeTier(def: InnerWayDef, node: InnerWayNode): number {
  const tier = innerWayNodeTier(def, node)
  if (tier === undefined) throw new Error(`${def.id} declares no tier for node "${node}"`)
  return tier
}
