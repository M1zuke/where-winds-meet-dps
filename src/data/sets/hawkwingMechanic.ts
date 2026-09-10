// The Hawkwing 4-piece ramps on affinity procs, so its stack count is an
// expectation over simulated runs rather than a window.
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  hawkwingStacksSchedule,
  type HawkwingStacksSchedule,
} from "../../engine/buffs/hawkwing"
import type { TimelineMechanic } from "../../engine/mechanics/types"

// The game's own Affinity-outcome roll is `min(affinityRate, 0.4) +
// directAffinityRate` (`formula.ts`'s `affinityRate`) — the direct-affinity
// term sits outside the cap, so a build with a base direct-affinity rate
// (Jadeware, an inner-way line) triggers stacks more often than the capped
// term alone predicts.
const AFFINITY_PROC_CAP = 0.4

type State = { schedule: HawkwingStacksSchedule }

// A factory rather than a module-level constant so this file need not import
// `hawkwing.ts` — `hawkwing.ts` imports this to declare the mechanic instead.
export function hawkwingMechanic(setId: string, setName: string): TimelineMechanic<State> {
  return {
    id: "hawkwing",

    prepare(setup) {
      if (setup.inputs.set !== setId) return null
      const proc =
        Math.min(setup.effectiveRates.affinityRate, AFFINITY_PROC_CAP) +
        setup.inputs.directAffinityRate
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
          name: "Hawkwing",
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
