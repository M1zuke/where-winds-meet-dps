// Insightful Strike's Concentration: a weapon hit can proc it, so its uptime is
// a probability schedule rather than a window. Tier 6 additionally multiplies
// DoT damage while it is up.
import { concentrationActiveProbSchedule } from "../../engine/buffs/concentration"
import { effectiveRates } from "../../engine/panel"
import { registerDisplayGate } from "../../engine/buffs/displayGates"
import { hasInnerWay, innerWayTier, type SlottedInnerWay } from "./innerWays"
import { MECHANIC_ORDER, registerMechanic } from "../../engine/mechanics"
import type { TimelineMechanic } from "../../engine/mechanics/types"

const CLASS_ID = "bellstrikeUmbra"
const INNER_WAY = "insightfulStrike"
const TIER_6 = 6
const AFFINITY_PROC_CAP = 0.4
const DOT_MULTIPLIER_AT_TIER_6 = 0.1
const DISPLAY_THRESHOLD = 0.5
const DOT_MULT_ROLES = ["role:bleedDetonation", "role:bleedTick", "role:combustion"]

const EFFECTS = [
  { statKey: "affinityDamageBoost" as const, amount: 0.1 },
  { statKey: "directAffinityRate" as const, amount: 0.03 },
  { statKey: "allDamageBoost" as const, amount: 0.015 },
]

// The Skill Editor shows this def as active for exactly the builds the mechanic
// runs for, so the gate is exported rather than mirrored there.
export function concentrationAvailable(inputs: {
  classId: string
  mindMethods: readonly SlottedInnerWay[]
}): boolean {
  return inputs.classId === CLASS_ID && hasInnerWay(inputs.mindMethods, INNER_WAY)
}

interface State {
  schedule: ReturnType<typeof concentrationActiveProbSchedule>
  tier6: boolean
}

export const concentrationMechanic: TimelineMechanic<State> = {
  id: "concentration",

  prepare(setup) {
    if (!setup.hasBuffEngine || !concentrationAvailable(setup.inputs)) return null
    const tier = innerWayTier(setup.inputs.mindMethods, INNER_WAY) ?? 0
    const proc =
      Math.min(effectiveRates(setup.inputs).affinityRate, AFFINITY_PROC_CAP) +
      setup.inputs.directAffinityRate
    return {
      schedule: concentrationActiveProbSchedule(
        setup.weaponHitTimesSec,
        proc,
        setup.rotationDurationSec,
      ),
      tier6: tier >= TIER_6,
    }
  },

  contributeAt(state, frame, skill, setup) {
    const activeProb = state.schedule.getActiveProbAtTime(frame / setup.fps)
    const effects =
      activeProb > 0
        ? EFFECTS.map((effect) => ({ statKey: effect.statKey, amount: effect.amount * activeProb }))
        : []
    const scaled = state.tier6 && skill && DOT_MULT_ROLES.some((role) => skill.tags?.includes(role))
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
        id: "concentration",
        name: "Concentration",
        stacks: 1,
        maxStacks: 1,
        effects: EFFECTS,
        description: `≈${Math.round(probability * 100)}% active`,
      },
    ]
  },
}

registerMechanic(concentrationMechanic, MECHANIC_ORDER.concentration)

registerDisplayGate("concentration", concentrationAvailable)
