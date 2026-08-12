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
  // Grants and refreshes one stack per damaging hit rather than per cast —
  // including hits a `castSkill` trigger generated and deterministic DoT ticks.
  stackOnDamage?: boolean
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
  activeAfterBuffEnds?: ActiveAfterBuffEnds
  conditionalFinalCrit?: ConditionalFinalCrit
  perCastConsume?: PerCastConsume
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
