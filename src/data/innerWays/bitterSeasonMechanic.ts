// The Bitter Season inner way: a stochastic per-hit poison proc that stacks a
// percentage target-defense reduction and decays, plus a DoT whose ticks are
// worth their probability of being up.
import {
  BITTER_SEASON_MAX_STACKS,
  BitterSeasonEnvelope,
  BitterSeasonTracker,
  bitterSeasonDebuffId,
  type BitterSeasonTuning,
} from "../../engine/buffs/bitterSeason"
import { bitterSeasonTuningAtTier } from "./bitterSeason"
import { getBreakthrough } from "../../definitions/baseStats/breakthroughs"
import { tierFromStacks, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { innerWayDefs } from "../../definitions/innerWays/defStore"
import { poisonExtensionForClass } from "../../definitions/classes/poisonExtensions"
import { UNOWNED, type StatusWindow } from "../../engine/ledger"
import type { BuffStatEffect } from "../../engine/buff"
import type { Inputs } from "../../engine/types"
import type { MechanicHost, TimelineMechanic } from "../../engine/mechanics/types"

const REMAINING_DISPLAY_THRESHOLD = 0.5

// Mirrors `slotInnerWayId`/`innerWayTier`/`henZhiActiveForInputs`
// (`definitions/innerWays/registry.ts`) against the raw store instead of
// through that registry itself. The registry unconditionally imports the
// `src/data/innerWays` barrel to guarantee it has loaded — but this mechanic
// is loaded AS PART OF the barrel building `bitterSeason.ts`, so importing
// the registry here reopens exactly the cycle the factory shape exists to
// avoid: confirmed by running the suite, `tests/engine/bitterSeason.test.ts`
// imports this inner way directly (before anything else touches the
// barrel), and `INNER_WAYS` ends up with an `undefined` slot. `defStore.ts`
// is the same data with none of that side effect, since every read here is
// deferred into `prepare()`, long after the whole module graph has settled.
function slotIdViaStore(slot: { id?: string; name: string }): string {
  if (slot.id !== undefined) return slot.id
  if (!slot.name) return ""
  if (innerWayDefs().some((def) => def.id === slot.name)) return slot.name
  return innerWayDefs().find((def) => def.name === slot.name)?.id ?? slot.name
}

function tierIfSlotted(mindMethods: Inputs["mindMethods"]): number | null {
  const slot = mindMethods.find(
    (candidate) => slotIdViaStore(candidate) === INNER_WAY_ID.bitterSeason,
  )
  return slot ? tierFromStacks(slot.stacks) : null
}

function activeDefsViaStore(mindMethods: Inputs["mindMethods"]): InnerWayDef[] {
  const out: InnerWayDef[] = []
  for (const def of innerWayDefs()) {
    if (!def.scalars) continue
    const slot = mindMethods.find((candidate) => slotIdViaStore(candidate) === def.id)
    if (!slot) continue
    if (def.scalars.minTier && tierFromStacks(slot.stacks) < def.scalars.minTier) continue
    out.push(def)
  }
  return out
}

// Mirrors `panel.ts henZhiActiveForInputs` — the party-applied debuff, or any
// slotted inner way whose `scalars.targetDefenseMultiplier` is set (none is,
// today).
function henZhiActive(inputs: Inputs): boolean {
  if (inputs.shareDebuff5HenZhi) return true
  return activeDefsViaStore(inputs.mindMethods).some(
    (def) => def.scalars?.targetDefenseMultiplier !== undefined,
  )
}

interface State {
  debuffId: string
  tuning: BitterSeasonTuning
  tracker: BitterSeasonTracker
  baseTargetDefense: number
  // A party-applied Bitter Season debuff already caps the reduction, so the
  // inner way adds none — but its poison still ticks.
  suppressed: boolean
  extensionStatusId: string | undefined
  maxRemainingSec: number
  poisonDurationSec: number
  envelope: BitterSeasonEnvelope | null
  openWindow: StatusWindow | null
  poisonSeeded: boolean
}

// A hoisted factory, not a plain object: `bitterSeason.ts` declares this as
// its mechanic, so this file's own top-level export must be safe to call
// before `./bitterSeason`'s cyclic import back into this module has finished
// — a function declaration is, an object literal bound to a `const` is not.
export function bitterSeasonMechanic(): TimelineMechanic<State> {
  return {
    id: "bitterSeasonPoison",

    prepare(setup) {
      const tier = tierIfSlotted(setup.inputs.mindMethods)
      if (tier === null) return null
      const tuning = bitterSeasonTuningAtTier(tier)
      const extension = poisonExtensionForClass(setup.classId)
      return {
        debuffId: bitterSeasonDebuffId(setup.classId),
        tuning,
        tracker: new BitterSeasonTracker(tuning.procChance, setup.rng, setup.collectHistory),
        baseTargetDefense: getBreakthrough(setup.inputs.breakthrough).defense,
        suppressed: henZhiActive(setup.inputs),
        extensionStatusId: extension?.statusId,
        maxRemainingSec: extension?.maxRemainingSec ?? Infinity,
        poisonDurationSec: 0,
        envelope: null,
        openWindow: null,
        poisonSeeded: false,
      }
    },

    start(state, host, setup) {
      if (!host.hasStatus(state.debuffId)) return
      const durationFrames = host.statusDurationFrames(state.debuffId) ?? 0
      if (durationFrames <= 0) return
      state.poisonDurationSec = durationFrames / setup.fps
      state.envelope = new BitterSeasonEnvelope(state.poisonDurationSec, state.maxRemainingSec)
    },

    // In-game values as of 2026-10-17: the poison and the defense-reducing charm
    // come from one roll on a direct damage event — a detonation burst
    // included, a DoT tick never — and land before that event's own damage.
    beforeEvent(state, event) {
      if (!event.direct) return
      state.tracker.roll(event.timeSec, event.occurrence, state.poisonDurationSec)
    },

    // The poison's own windows: bounded to the guaranteed-proc envelope rather
    // than one span covering the rotation, since the poison's active
    // probability is 0 outside it and no expected damage is lost by not ticking
    // there.
    observeEvent(state, event, setup, host) {
      if (!event.direct || !state.envelope) return
      state.envelope.hit(event.timeSec)
      syncWindow(state, host, setup.fps, Math.round(event.timeSec * setup.fps))
    },

    onWindowOpened(state, statusId, window, host, setup) {
      if (statusId !== state.extensionStatusId || !state.envelope) return
      state.tracker.extendPoison(window.start / setup.fps, state.maxRemainingSec)
      state.envelope.extension(window.start / setup.fps)
      syncWindow(state, host, setup.fps, window.start)
    },

    contributeAt(state, frame, _skill, setup) {
      if (state.suppressed) return null
      const timeSec = frame / setup.fps
      const effects: BuffStatEffect[] = []
      const stacks = state.tracker.expectedStacksAt(timeSec)
      if (stacks > 0) {
        effects.push({
          statKey: "target.defense",
          amount: -stacks * state.tuning.defenseReductionPerStack * state.baseTargetDefense,
        })
      }
      if (state.tuning.physPenetrationAtMaxStacks > 0) {
        const maxStackProb = state.tracker.maxStackProbAt(timeSec)
        if (maxStackProb > 0) {
          effects.push({
            statKey: "phys.penetration",
            amount: state.tuning.physPenetrationAtMaxStacks * maxStackProb,
          })
        }
      }
      return effects.length > 0 ? { effects } : null
    },

    tickWeightAt(state, debuffId, frame, setup) {
      if (debuffId !== state.debuffId || !state.envelope) return null
      return state.tracker.poisonActiveProbAt(frame / setup.fps)
    },

    // Below the display threshold there is a real chance no poison has procced
    // yet, so the expected-remaining number alone would read as an oddly short
    // duration — withhold it until more likely than not to be up.
    remainingSecAt(state, id, timeSec) {
      if (id !== state.debuffId || !state.envelope) return null
      const likely = state.tracker.poisonActiveProbAt(timeSec) >= REMAINING_DISPLAY_THRESHOLD
      const activeSec = likely ? state.tracker.poisonRemainingSecAt(timeSec) : 0
      return { seconds: activeSec > 0 ? activeSec : undefined }
    },

    display(state, timeSec, prePull) {
      if (prePull) return []
      const shown = state.suppressed
        ? BITTER_SEASON_MAX_STACKS
        : Math.round(state.tracker.expectedStacksAt(timeSec))
      if (shown < 1) return []
      const uptimePct = Math.round(
        (state.envelope ? state.tracker.poisonActiveProbAt(timeSec) : 0) * 100,
      )
      // Stated as the target physical defense reduction the in-game hint words
      // it as, even though the tier-6 node is implemented through
      // `phys.penetration`.
      const currentDefensePct = Math.round(state.tuning.defenseReductionPerStack * shown * 100)
      const tier6FlatAmount = state.tuning.physPenetrationAtMaxStacks * 100
      const mechanicText =
        `at ${shown}/${BITTER_SEASON_MAX_STACKS} stacks: -${currentDefensePct}% target physical defense` +
        (tier6FlatAmount > 0
          ? ` · -${tier6FlatAmount} target physical defense at ${BITTER_SEASON_MAX_STACKS}/${BITTER_SEASON_MAX_STACKS} stacks (tier 6)`
          : "")
      return [
        {
          id: "bitterSeasonPoison",
          name: "Bitter Season Poison",
          stacks: shown,
          maxStacks: BITTER_SEASON_MAX_STACKS,
          effects: [],
          description: state.suppressed
            ? "party-applied Bitter Season debuff already caps the reduction — the inner way adds none"
            : `expected stacks (avg of 500 sims, rounded) · ${mechanicText} · ≈${uptimePct}% poison uptime`,
        },
      ]
    },
  }
}

function syncWindow(state: State, host: MechanicHost, fps: number, causedAtFrame: number): void {
  const envelope = state.envelope!
  const windows = envelope.windowsSoFar()
  const latest = windows[windows.length - 1]
  const startFrame = Math.round(latest.startSec * fps)
  const endFrame = Math.round(latest.endSec * fps)
  if (!state.openWindow || state.openWindow.start !== startFrame) {
    host.ledger.pushWindow(state.debuffId, startFrame, endFrame)
    const pushed = host.ledger.windowsOf(state.debuffId)
    state.openWindow = pushed[pushed.length - 1]
    if (!state.poisonSeeded) {
      state.poisonSeeded = true
      host.ledger.recordStack(state.debuffId, startFrame, 1)
    }
  } else if (endFrame > state.openWindow.end) {
    host.ledger.extendWindow(state.openWindow, causedAtFrame, endFrame, UNOWNED)
  }
}
