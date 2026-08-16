// The Hawking 4-piece ramps on affinity procs, so its stack count is an
// expectation over simulated runs rather than a window.
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  hawkwingStacksSchedule,
  type HawkwingStacksSchedule,
} from "../../engine/buffs/hawkwing"
import type { TimelineMechanic } from "../../engine/mechanics/types"

const AFFINITY_PROC_CAP = 0.4

type State = { schedule: HawkwingStacksSchedule }

// A factory rather than a module-level constant so this file need not import
// `hawking.ts` — `hawking.ts` imports this to declare the mechanic instead.
export function hawkwingMechanic(setId: string, setName: string): TimelineMechanic<State> {
  return {
    id: "hawkwing",

    prepare(setup) {
      if (setup.inputs.set !== setId) return null
      const proc = Math.min(setup.effectiveRates.affinityRate, AFFINITY_PROC_CAP)
      return {
        schedule: hawkwingStacksSchedule(
          setup.hitTimesSec,
          proc,
          setup.rotationDurationSec,
          setup.rng,
        ),
      }
    },

    contributeAt(state, frame, _skill, setup) {
      const stacks = Math.round(state.schedule.getExpectedStacksAtTime(frame / setup.fps))
      return { context: { hawkwingPhysBonus: stacks * HAWKWING_BONUS_PER_STACK } }
    },

    display(state, timeSec, prePull) {
      if (prePull) return []
      const stacks = Math.round(state.schedule.getExpectedStacksAtTime(timeSec))
      if (stacks < 1) return []
      return [
        {
          id: "hawkwing",
          name: "Hawkwing (4-pc)",
          stacks,
          maxStacks: HAWKWING_MAX_STACKS,
          effects: [],
          requires: setName,
          description:
            "expected stacks (avg of 500 sims, rounded) · +2% phys attack/stack, 5s decay",
        },
      ]
    },
  }
}
