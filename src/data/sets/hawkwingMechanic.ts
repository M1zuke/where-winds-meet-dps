// The Hawkwing 4-piece ramps on affinity procs, so its stack count is an
// expectation over simulated runs rather than a window.
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  HawkwingTracker,
} from "../../engine/buffs/hawkwing"
import type { TimelineMechanic } from "../../engine/mechanics/types"
import { FOUR_PIECE_SIZE, setPieceCount } from "../../engine/setPieces"

type State = { tracker: HawkwingTracker }

// A factory rather than a module-level constant so this file need not import
// `hawkwing.ts` — `hawkwing.ts` imports this to declare the mechanic instead.
export function hawkwingMechanic(setId: string, setName: string): TimelineMechanic<State> {
  return {
    id: "hawkwing",
    needsAffinityChance: true,

    prepare(setup) {
      if (setPieceCount(setup.inputs, setId) < FOUR_PIECE_SIZE) return null
      return { tracker: new HawkwingTracker(setup.rng, setup.collectHistory) }
    },

    // In-game values as of 2026-10-17: every hit, DoT tick, detonation burst
    // and summoned hit that lands an Affinity outcome adds a stack after that
    // event's own damage; the chance is that event's own Affinity chance.
    observeEvent(state, event) {
      if (!event.canRollAffinity) return
      state.tracker.roll(
        event.timeSec,
        event.occurrence,
        event.affinityChance,
        event.rolledAffinity,
      )
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
