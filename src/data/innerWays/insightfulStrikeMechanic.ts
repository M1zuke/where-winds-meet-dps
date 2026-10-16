// Insightful Strike's Concentration: an affinity outcome builds Focus, so its uptime is
// a probability schedule rather than a window — the def vocabulary has no
// stochastic per-hit proc, which is why this is a mechanic.
import { ConcentrationTracker } from "../../engine/buffs/concentration"
import { innerWayHasNode, slottedInnerWayTier } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { BUFF } from "../skills/buffs/ids"
import { PROP } from "../skills/ids"
import { skillTagsOf } from "../../engine/buffs/tags"
import { insightfulStrike } from "./insightfulStrike"
import type { Skill } from "../../engine/skill"
import type { TimelineMechanic } from "../../engine/mechanics/types"

const DOT_DAMAGE_BONUS_AT_TIER_6 = 0.1
const DISPLAY_THRESHOLD = 0.5

// In-game values as of 2026-10-15: Focus per affinity outcome.
const FOCUS_PER_AFFINITY = 10
const FOCUS_PER_AFFINITY_FROM_TIER_4 = 15
const FASTER_FOCUS_FIRST_TIER = 4

// In-game values as of 2026-10-15: one half always, the other only while the
// target's HP percentage is below the player's. Concentration needs affinity
// outcomes already landed on the target, so the player's untouched HP stays
// above the target's for as long as it is up and both halves always apply.
const DIRECT_AFFINITY_ALWAYS = 0.015
const DIRECT_AFFINITY_WHILE_TARGET_HP_LOWER = 0.015
const DIRECT_AFFINITY_WHILE_ACTIVE = DIRECT_AFFINITY_ALWAYS + DIRECT_AFFINITY_WHILE_TARGET_HP_LOWER

// In-game text, 2026-09-10: the tier-6 rung raises "DoT and its empowered
// effects" — a wider set than the ticks.
function takesDotDamageBoost(skill: Skill | undefined): boolean {
  if (!skill) return false
  return skill.isDotTick === true || skillTagsOf(skill).has(PROP.empoweredDotEffect)
}

const EFFECTS = [
  { statKey: "affinityDamageBoost" as const, amount: 0.1 },
  { statKey: "directAffinityRate" as const, amount: DIRECT_AFFINITY_WHILE_ACTIVE },
  { statKey: "allDamageBoost" as const, amount: 0.015 },
]

export function concentrationAvailable(inputs: {
  mindMethods: readonly { id?: string; name: string; stacks: string }[]
}): boolean {
  return slottedInnerWayTier(inputs.mindMethods, insightfulStrike) !== null
}

interface State {
  tracker: ConcentrationTracker
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
      return {
        tracker: new ConcentrationTracker(
          {
            focusPerAffinity:
              tier >= FASTER_FOCUS_FIRST_TIER ? FOCUS_PER_AFFINITY_FROM_TIER_4 : FOCUS_PER_AFFINITY,
            chanceBonusWhileActive: DIRECT_AFFINITY_WHILE_ACTIVE,
          },
          setup.rng,
        ),
        tier6: innerWayHasNode(insightfulStrike, tier, INNER_WAY_NODE.concentrationDotMultiplier),
      }
    },

    // Direct hits and DoT ticks alike roll the affinity that builds Focus
    // (in-game values as of 2026-10-15).
    observeEvent(state, event) {
      state.tracker.observe(event)
    },

    contributeAt(state, frame, skill, setup) {
      const timeSec = frame / setup.fps
      const activeProb = state.tracker.activeShareNow(timeSec)
      if (activeProb <= 0) return null
      const effects = EFFECTS.map((effect) => ({
        statKey: effect.statKey,
        amount: effect.amount * activeProb,
      }))
      if (state.tier6 && takesDotDamageBoost(skill))
        effects.push({ statKey: "allDamageBoost", amount: DOT_DAMAGE_BONUS_AT_TIER_6 * activeProb })
      return { effects }
    },

    display(state, timeSec, prePull) {
      if (prePull) return []
      const probability = state.tracker.activeShareAtTime(timeSec)
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
