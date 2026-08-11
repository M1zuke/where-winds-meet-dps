import type { Effect } from "../effects/effect"
import type { EffectContext } from "../effects/context"

export interface BuffRequirements {
  param?: string
  minTier?: number
  set?: string
}

export interface ActiveAfterBuffEnds {
  buffId: string
  cancelledByReapply?: boolean
}

// The declarative core: the Skill Editor catalog derives `affects`, `bonus`,
// `triggeredBy`, `enabledParam`, `minTier` and the Receives / Applies / Class
// Buffs rows from these fields, and `displayGates.ts` filters on them, so they
// must stay readable without executing anything.
export interface BuffMeta {
  id: string
  name: string
  requires?: BuffRequirements
  affects?: string[] | null
  affectsProperty?: string
  affectsWeaponTypes?: string[]
  excludes?: string[]
  triggeredBy?: string[]
  alwaysActive?: boolean
  buffAppliesOnCastEnd?: boolean
  maxStacks?: number
  cooldown?: number
  rateLimit?: { count: number; window: number }
  stackRateLimit?: { count: number; window: number }
  stacksPerHit?: boolean
  seedAtStart?: boolean
  refreshOnAnyCast?: boolean
  requiresBuffActive?: string
  activeAfterBuffEnds?: ActiveAfterBuffEnds
  stacks?: (ctx: EffectContext) => number
  duration: number | ((ctx: EffectContext) => number)
}

// `summary` is required exactly when `effects` cannot be read without running
// it — a plain union, not a conditional type, so the compiler forces an
// author-written description only where it cannot derive one.
export type BuffModule = BuffMeta &
  (
    | { effects: Effect[]; summary?: string }
    | { effects: (ctx: EffectContext) => Effect[]; summary: string }
  )
