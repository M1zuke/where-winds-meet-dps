// A mechanic the buff-def schema genuinely cannot express: a stochastic
// per-hit proc, a decaying stack curve, a probability schedule. Each was a
// block inline in `simulateTimeline`, which is why the timeline had to know
// every one of them by name.
//
// BUFFS.md § "Known exceptions" is the bar for adding one: not "it was easier
// here", but "the def schema cannot express this".
import type { Inputs } from "../types"
import type { Skill } from "../skill"
import type { BuffStatEffect } from "../buff"
import type { CastBuffTag } from "../types"
import type { StatusLedger } from "../ledger"
import type { QiPhase } from "../behavior"

export interface MechanicSetup {
  inputs: Inputs
  classId: string
  fps: number
  rotationDurationSec: number
  // Every damaging hit, and the subset from weapon-typed skills, in seconds and
  // ascending — what a proc schedule is built from.
  hitTimesSec: readonly number[]
  weaponHitTimesSec: readonly number[]
  qiPhaseAt(timeSec: number): QiPhase
  // The resolved buff-engine params, so a mechanic gates on exactly what the
  // engine gated on rather than re-deriving it from `mindMethods`.
  paramOn(name: string): boolean
  paramTier(name: string): number
  hasBuffEngine: boolean
  // `panel.ts effectiveRates`'s result (yellow, post-resistance), computed
  // once in `timeline.ts` — see CLAUDE.md § "White vs Yellow rates". A
  // mechanic reads this rather than re-deriving it from `inputs`.
  effectiveRates: { precision: number; critRate: number; affinityRate: number }
}

// Two of the formula's inputs are not `{statKey, amount}` deltas and so cannot
// travel as effects — they reach `buildContext` directly. Named for what the
// formula calls them rather than for the mechanic that supplies them.
export interface ContextPatch {
  hawkwingPhysBonus?: number
  dotDamageMultiplier?: number
}

export interface MechanicContribution {
  effects?: BuffStatEffect[]
  context?: ContextPatch
}

export interface MechanicSeedTarget {
  ledger: StatusLedger
  hasStatus(id: string): boolean
  // A DoT the mechanic seeds windows for needs that debuff's own duration.
  statusDurationFrames(id: string): number | null
}

export interface TimelineMechanic<State = unknown> {
  id: string
  // Returning null means "not in this build" — how a mechanic gates itself
  // without the timeline knowing why.
  prepare(setup: MechanicSetup): State | null
  // Contributions are collected in REGISTRY ORDER and applied in that order.
  // Float addition is not associative, so the order is load-bearing.
  contributeAt?(
    state: State,
    frame: number,
    skill: Skill | undefined,
    setup: MechanicSetup,
  ): MechanicContribution | null
  // Windows a mechanic opens itself, rather than through a hit's triggers.
  seedStatuses?(state: State, target: MechanicSeedTarget, setup: MechanicSetup): void
  // What a DoT tick from this debuff is worth at this frame — the probability
  // it is actually up. `null` means "not mine".
  tickWeightAt?(state: State, debuffId: string, frame: number, setup: MechanicSetup): number | null
  // Damage this mechanic deals on its own schedule, independent of any cast.
  extraEvents?(state: State, setup: MechanicSetup): MechanicEvent[]
  // Replaces the window-derived duration on a status chip with one only the
  // mechanic can compute. `null` means "not mine".
  remainingSecAt?(
    state: State,
    statusId: string,
    timeSec: number,
  ): { seconds: number | undefined } | null
  display?(state: State, timeSec: number, prePull: boolean, setup: MechanicSetup): CastBuffTag[]
}

export interface MechanicEvent {
  frame: number
  skill: Skill
  art: Record<string, unknown>
  name: string
  type: string
}
