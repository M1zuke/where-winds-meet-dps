// Insightful Strike's Concentration: a weapon hit can proc it, so its uptime is
// a probability schedule rather than a window — the def vocabulary has no
// stochastic per-hit proc, which is why this is a mechanic.
import { concentrationActiveProbSchedule } from "../../engine/buffs/concentration"
import { innerWayHasNode, slottedInnerWayTier } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { BUFF } from "../skills/buffs/ids"
import { PROP } from "../skills/ids"
import { skillTagsOf } from "../../engine/buffs/tags"
import { insightfulStrike } from "./insightfulStrike"
import type { Skill } from "../../engine/skill"
import type { TimelineMechanic } from "../../engine/mechanics/types"

const AFFINITY_PROC_CAP = 0.4
const DOT_MULTIPLIER_AT_TIER_6 = 0.1
const DISPLAY_THRESHOLD = 0.5

// In-game text, 2026-09-10: the tier-6 rung raises "DoT and its empowered
// effects" — a wider set than the ticks.
function takesDotDamageBoost(skill: Skill | undefined): boolean {
  if (!skill) return false
  return skill.isDotTick === true || skillTagsOf(skill).has(PROP.empoweredDotEffect)
}

const EFFECTS = [
  { statKey: "affinityDamageBoost" as const, amount: 0.1 },
  { statKey: "directAffinityRate" as const, amount: 0.03 },
  { statKey: "allDamageBoost" as const, amount: 0.015 },
]

export function concentrationAvailable(inputs: {
  mindMethods: readonly { id?: string; name: string; stacks: string }[]
}): boolean {
  return slottedInnerWayTier(inputs.mindMethods, insightfulStrike) !== null
}

interface State {
  schedule: ReturnType<typeof concentrationActiveProbSchedule>
  tier6: boolean
}

// A hoisted factory, not a plain object: `insightfulStrike.ts` declares this
// as its mechanic, so this file's own top-level export must be safe to call
// before `./insightfulStrike`'s cyclic import back into this module has
// finished — a function declaration is, an object literal bound to a `const`
// is not.
export function insightfulStrikeMechanic(): TimelineMechanic<State> {
  return {
    id: BUFF.concentration,

    catalogRow: {
      name: "Concentration",
      effects: () => EFFECTS,
      available: concentrationAvailable,
    },

    prepare(setup) {
      if (!setup.hasBuffEngine || !concentrationAvailable(setup.inputs)) return null
      const tier = slottedInnerWayTier(setup.inputs.mindMethods, insightfulStrike) ?? 0
      const proc =
        Math.min(setup.effectiveRates.affinityRate, AFFINITY_PROC_CAP) +
        setup.inputs.directAffinityRate
      return {
        schedule: concentrationActiveProbSchedule(
          setup.weaponHitTimesSec,
          proc,
          setup.rotationDurationSec,
          setup.rng,
        ),
        tier6: innerWayHasNode(insightfulStrike, tier, INNER_WAY_NODE.concentrationDotMultiplier),
      }
    },

    contributeAt(state, frame, skill, setup) {
      const activeProb = state.schedule.getActiveProbAtTime(frame / setup.fps)
      const effects =
        activeProb > 0
          ? EFFECTS.map((effect) => ({
              statKey: effect.statKey,
              amount: effect.amount * activeProb,
            }))
          : []
      const scaled = state.tier6 && takesDotDamageBoost(skill)
      if (effects.length === 0 && !scaled) return null
      return {
        effects,
        context: scaled
          ? { dotDamageMultiplier: 1 + DOT_MULTIPLIER_AT_TIER_6 * activeProb }
          : undefined,
      }
    },

    display(state, timeSec, prePull) {
      if (prePull) return []
      const probability = state.schedule.getActiveProbAtTime(timeSec)
      if (probability < DISPLAY_THRESHOLD) return []
      return [
        {
          id: BUFF.concentration,
          name: "Concentration",
          stacks: 1,
          maxStacks: 1,
          effects: EFFECTS,
          description: `≈${Math.round(probability * 100)}% active`,
        },
      ]
    },
  }
}
