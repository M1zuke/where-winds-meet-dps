// The Hawkwing 4-piece ramps on affinity procs, so its stack count is an
// expectation over simulated runs rather than a window.
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  HawkwingTracker,
} from "../../engine/buffs/hawkwing"
import type { TimelineMechanic } from "../../engine/mechanics/types"
import { FOUR_PIECE_SIZE, setPieceCount } from "../../engine/setPieces"

// The game's own Affinity-outcome roll is `min(affinityRate, 0.4) +
// directAffinityRate` (`formula.ts`'s `affinityRate`) — the direct-affinity
// term sits outside the cap, so a build with a base direct-affinity rate
// (Jadeware, an inner-way line) triggers stacks more often than the capped
// term alone predicts.
const AFFINITY_PROC_CAP = 0.4

type State = { tracker: HawkwingTracker }

// A factory rather than a module-level constant so this file need not import
// `hawkwing.ts` — `hawkwing.ts` imports this to declare the mechanic instead.
export function hawkwingMechanic(setId: string, setName: string): TimelineMechanic<State> {
  return {
    id: "hawkwing",

    prepare(setup) {
      if (setPieceCount(setup.inputs, setId) < FOUR_PIECE_SIZE) return null
      const proc =
        Math.min(setup.effectiveRates.affinityRate, AFFINITY_PROC_CAP) +
        setup.inputs.directAffinityRate
      return { tracker: new HawkwingTracker(proc, setup.rng, setup.collectHistory) }
    },

    // In-game values as of 2026-10-17: every hit, DoT tick, detonation burst
    // and summoned hit rolls the affinity chance, and the stack lands after
    // that event's own damage.
    observeEvent(state, event) {
      if (!event.canRollAffinity) return
      state.tracker.roll(event.timeSec, event.occurrence)
    },

    contributeAt(state, frame, _skill, setup) {
      const bonus = state.tracker.expectedStacksAt(frame / setup.fps) * HAWKWING_BONUS_PER_STACK
      return { context: { hawkwingPhysBonus: bonus, bellstrikeAttackPctBonus: bonus } }
    },

    display(state, timeSec, prePull) {
      if (prePull) return []
      const stacks = Math.round(state.tracker.expectedStacksAt(timeSec))
      if (stacks < 1) return []
      return [
        {
          id: "hawkwing",
          name: "Hawkwing",
          stacks,
          maxStacks: HAWKWING_MAX_STACKS,
          effects: [],
          requires: setName,
          description:
            "expected stacks (avg of 500 sims, rounded) · +1.8% phys and Bellstrike attack/stack, 5s decay",
        },
      ]
    },
  }
}
