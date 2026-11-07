// A mechanic the buff-def schema genuinely cannot express: a stochastic
// per-hit proc, a decaying stack curve, a probability schedule. Each was a
// block inline in `simulateTimeline`, which is why the timeline had to know
// every one of them by name.
//
// BUFFS.md § "Mechanics — the last resort" is the bar: not "it was easier
// here", but "the def schema cannot express this".
import type { Inputs } from "../types"
import type { Skill } from "../skill"
import type { BuffStatEffect } from "../buff"
import type { CastBuffTag } from "../types"
import type { StatusLedger, StatusWindow } from "../ledger"
import type { QiPhase } from "../behavior"

export interface MechanicSetup {
  inputs: Inputs
  classId: string
  fps: number
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
  // Whether the run reports per-cast detail, which is what a mechanic's
  // historical readout (`display`, `remainingSecAt`) is for.
  collectHistory: boolean
  // This mechanic's own substream of the run's seed, present only on a seeded
  // run. A tracker that receives it runs one trajectory off it — docs/CALCULATION.md
  // § "Mechanic rules".
  rng?: () => number
}

// `hawkwingPhysBonus` is not a `{statKey, amount}` delta and so cannot travel
// as an effect — it reaches `buildContext` directly. Named for what the
// formula calls it rather than for the mechanic that supplies it.
export interface ContextPatch {
  hawkwingPhysBonus?: number
  bellstrikeAttackPctBonus?: number
}

export interface MechanicContribution {
  effects?: BuffStatEffect[]
  context?: ContextPatch
}

export interface MechanicHost {
  ledger: StatusLedger
  hasStatus(id: string): boolean
  // A DoT the mechanic seeds windows for needs that debuff's own duration.
  statusDurationFrames(id: string): number | null
  scheduleExtra(event: MechanicEvent): void
}

// The Skill Editor's Receives row for a mechanic. A mechanic is still a
// modifier the user needs to see where they edit skills, and it already holds
// the name, the magnitudes and the availability test — so the catalog reads
// them from here. A def that restated them and applied nothing would be the
// wrapper BUFFS.md § "One declaration, one id, two projections" forbids, and is
// how Concentration came to be counted twice.
// `effects` is read through a call, never held as a value: a mechanic module
// and the def that declares it import each other, so the row is built while
// the mechanic module's own top-level consts are still in TDZ.
export interface MechanicCatalogRow {
  name: string
  effects(): readonly BuffStatEffect[]
  available(inputs: Inputs): boolean
}

export interface TimelineMechanic<State = unknown> {
  id: string
  // Whether this mechanic's `contributeAt` reads the encounter's target
  // distance — the same visibility declaration a `BuffModule` makes with its
  // own `readsTargetDistance`.
  readsTargetDistance?: boolean
  // Whether `observeEvent` reads `MechanicObservedEvent.affinityChance`, which
  // costs one extra damage query per event.
  needsAffinityChance?: boolean
  catalogRow?: MechanicCatalogRow
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
  // Once, before the run's first event, for a mechanic that acts on the clock
  // rather than on an event.
  start?(state: State, host: MechanicHost, setup: MechanicSetup): void
  // Before a damage event is scored, for an effect the game applies ahead of
  // that event's own damage so it reaches the event.
  beforeEvent?(state: State, event: MechanicEventInfo, setup: MechanicSetup): void
  // After a damage event is scored, in processing order — docs/CALCULATION.md
  // § "Mechanic rules".
  observeEvent?(
    state: State,
    event: MechanicObservedEvent,
    setup: MechanicSetup,
    host: MechanicHost,
  ): void
  afterExtraEvent?(
    state: State,
    event: MechanicEvent,
    host: MechanicHost,
    setup: MechanicSetup,
  ): void
  onWindowOpened?(
    state: State,
    statusId: string,
    window: StatusWindow,
    host: MechanicHost,
    setup: MechanicSetup,
  ): void
  // What a DoT tick from this debuff is worth at this frame — the probability
  // it is actually up. `null` means "not mine".
  tickWeightAt?(state: State, debuffId: string, frame: number, setup: MechanicSetup): number | null
  // Replaces the window-derived duration on a status chip with one only the
  // mechanic can compute. `null` means "not mine".
  remainingSecAt?(
    state: State,
    statusId: string,
    timeSec: number,
  ): { seconds: number | undefined } | null
  display?(state: State, timeSec: number, prePull: boolean, setup: MechanicSetup): CastBuffTag[]
}

export type MechanicEventSource = "hit" | "tick" | "extra"

export interface MechanicEventInfo {
  timeSec: number
  // Below 1 for a tick or a launch that only part of the run's trajectories reach.
  occurrence: number
  source: MechanicEventSource
  // A direct hit, as opposed to a damage-over-time tick: every hit, and a
  // tick whose DoT declares `directHit`.
  direct: boolean
  canRollAffinity: boolean
}

export interface MechanicObservedEvent extends MechanicEventInfo {
  // Read without the observing mechanic's own contribution.
  affinityChance: number
  // Present only on a run that rolls hits.
  rolledAffinity?: boolean
}

export interface MechanicEvent {
  frame: number
  skill: Skill
  art: Record<string, unknown>
  name: string
  type: string
  direct: boolean
  // The event's own Qi rate/flat channel, in-game values as of 2026-09-25 —
  // docs/CALCULATION.md § "Qi damage". Absent means rate 1, flat 0.
  qiRate?: number
  qiFlat?: number
  // Absent means "direct" — the post-break immunity window only ever exempts
  // a tick.
  qiHitKind?: "direct" | "dot"
}
