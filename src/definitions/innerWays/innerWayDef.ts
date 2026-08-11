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

// An inner way is not owned by a class and must not name one — the class
// registry stamps `classId` onto each record when it composes a class's
// `builtinBuffsForClass` set from the inner ways that class can slot.
export type InnerWayGateBuff = Omit<Buff, "classId">

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
  // Timeline gates every class that can slot this inner way inherits — folded
  // into that class's own built-in buff pool by `definitions/classes/registry.ts`.
  gateBuffs?: readonly InnerWayGateBuff[]
  // Registered directly by the inner-way registry, since the Skill Editor's
  // display-gate map is global and def-id-keyed with no owner concept, so no
  // class composition step is needed here.
  displayGates?: readonly DisplayGateRegistration[]
  // Folded into every slotting class's own `classBuffDefs` by
  // `definitions/classes/registry.ts`'s `buffModules` — unlike `displayGates`,
  // this needs a per-class composition step because `BuffEngine` is
  // constructed per class, not globally.
  buffDefs?: readonly BuffModule[]
  // Registered directly by the inner-way registry — a `{ skillId, factory }`
  // binding is registered once regardless of which classes can slot this
  // inner way, so it needs no class composition step either.
  skillBehaviors?: readonly SkillBehaviorRegistration[]
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

// For a call site that feeds a persisted/serialized field (a `requires.minTier`,
// a debuff's `retainMinTier`) rather than a live tier comparison: `undefined`
// there doesn't crash, it silently ungates the def or lets it apply at every
// tier. Throwing catches a dropped node instead — at load time for an eager
// caller (`debuffs.ts`'s `retainMinTier`), but only on first use for a caller
// deferred behind a getter or an `effects` closure (`wolfchasersArtBuffs.ts`'s
// `minTier`, `insightfulStrikeConcentration.ts`'s tier read) — where the throw
// surfaces inside `BuffEngine.processSkillCast`, which `timeline.ts` wraps in
// a `try/catch` that returns `null`, so it silently disables the whole buff
// engine rather than crashing loudly. What actually keeps a node from being
// dropped either way is `tests/data/innerWays.test.ts`'s "every
// `INNER_WAY_NODE` value is declared by exactly one def" pin, not this throw.
export function requireInnerWayNodeTier(def: InnerWayDef, node: InnerWayNode): number {
  const tier = innerWayNodeTier(def, node)
  if (tier === undefined) throw new Error(`${def.id} declares no tier for node "${node}"`)
  return tier
}
