import type { Effect } from "../effects/effect"
import type { EffectContext, QiPhase } from "../effects/context"

export interface BuffRequirements {
  param?: string
  minTier?: number
  set?: string
}

export interface ActiveAfterBuffEnds {
  buffId: string
  cancelledByReapply?: boolean
}

// The one crit rule that reads the rolled rate rather than a panel stat, so it
// travels to `computeSkillDamage` as an art field instead of a `stat` effect.
export interface ConditionalFinalCrit {
  threshold: number
  bonusBelowThreshold: number
}

// A damaging hit from a skill that reaches this def, while its window is
// down, spends one stack of `from` and opens the window at that hit; hits
// while it is live neither spend nor extend it.
export interface PerHitConsume {
  from: string
}

// A cast that spends a stack of another buff. `from` is the fallback pool;
// `preferredFrom` is drained first where both are live. `grants` names buffs
// the successful consume attaches to that cast — `propagate` extends them to
// the skills that cast generates, which is event state for that cast, not a
// timed window.
export interface PerCastConsume {
  /** A `PROP.*` tag; the engine reads the matching `SkillProperties` key. */
  property: string
  from: string
  preferredFrom?: readonly string[]
  grants?: readonly { whenConsumedFrom: string; buffIds: readonly string[]; propagate?: boolean }[]
  // A second route to the same bonus, riding a Qi phase instead of a consume.
  phaseAlternative?: { phase: QiPhase | readonly QiPhase[]; requires?: BuffRequirements }
}

// The declarative core: the Skill Editor catalog derives `bonus`, `enabledParam`,
// `minTier` and the Receives / Applies / Class Buffs rows from these fields, and
// `displayGates.ts` filters on them, so they must stay readable without
// executing anything.
export interface BuffMeta {
  id: string
  name: string
  requires?: BuffRequirements
  affectsAll?: boolean
  alwaysActive?: boolean
  buffAppliesOnCastEnd?: boolean
  maxStacks?: number
  cooldown?: number
  rateLimit?: { count: number; window: number }
  stackRateLimit?: { count: number; window: number }
  stacksPerHit?: boolean
  stackOnDamage?: boolean
  // Restricts `stackOnDamage` to the listed Qi phases; a damaging hit outside
  // them grants no stack. Independent of `triggerPhase`, which gates the cast
  // route only.
  stackOnDamagePhase?: QiPhase | readonly QiPhase[]
  // Restricts `stackOnDamage` to hits from skills that reach this def — the
  // same `reaches` predicate the damage query uses.
  stackOnDamageScoped?: boolean
  // `stackOnDamage` only tops up a live window, preserving its expiry — it
  // never opens or refreshes one.
  stackOnDamageOnlyWhileActive?: boolean
  // Caps the `stackOnDamage` route alone; `stackRateLimit` still caps the
  // triggered route.
  stackOnDamageRateLimit?: { count: number; window: number }
  // A generated (`castSkill`-triggered) attack reaches only the defs that opt
  // in; every other def still sees rotation casts alone.
  triggersFromGeneratedSkills?: boolean
  // Restricts the trigger to one Qi phase; a cast in any other phase is not a
  // trigger for this def at all, so no stack and no refresh.
  triggerPhase?: QiPhase
  seedAtStart?: boolean
  refreshOnAnyCast?: boolean
  requiresBuffActive?: string
  // Read at trigger time against the live window, not at damage time.
  requiresActiveBuffOnTrigger?: string
  // A `PROP.*` tag naming triggers that may only EXTEND an already-open
  // window, never open one. A trigger without the property is unaffected, so
  // one def can have both an opening source and an extending source.
  extendedOnlyByProperty?: string
  activeAfterBuffEnds?: ActiveAfterBuffEnds
  conditionalFinalCrit?: ConditionalFinalCrit
  perCastConsume?: PerCastConsume
  perHitConsume?: PerHitConsume
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
