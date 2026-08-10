// The Hawking 4-piece ramps on affinity procs, so its stack count is an
// expectation over simulated runs rather than a window.
import {
  HAWKWING_BONUS_PER_STACK,
  HAWKWING_MAX_STACKS,
  hawkwingStacksSchedule,
  type HawkwingStacksSchedule,
} from "../buffs/hawkwing"
import { effectiveRates } from "../panel"
import type { TimelineMechanic } from "./types"

const SET = "Hawking"
const AFFINITY_PROC_CAP = 0.4

type State = { schedule: HawkwingStacksSchedule }

export const hawkwingMechanic: TimelineMechanic<State> = {
  id: "hawkwing",

  prepare(setup) {
    if (setup.inputs.set !== SET) return null
    const proc = Math.min(effectiveRates(setup.inputs).affinityRate, AFFINITY_PROC_CAP)
    return {
      schedule: hawkwingStacksSchedule(setup.hitTimesSec, proc, setup.rotationDurationSec),
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
        requires: SET,
        description: "expected stacks (avg of 500 sims, rounded) · +2% phys attack/stack, 5s decay",
      },
    ]
  },
}
