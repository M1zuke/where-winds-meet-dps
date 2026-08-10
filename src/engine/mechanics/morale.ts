// Morale Chant's stack curve, and — at tier 6 — Yi River, a periodic hit that
// takes no weapon or mystic boosts (`.tmp/site/deobfuscated.js`
// `yiRiver.calculate` ~L21287-21409).
import type { Skill } from "../skill"
import {
  MORALE_MAX_STACKS,
  MORALE_PEN_PER_STACK,
  MORALE_STACK_THRESHOLD,
  YI_RIVER_INTERVAL_SEC,
  moraleDmgPerStack,
  moraleStacksAtTime,
} from "../buffs/morale"
import { MECHANIC_ORDER, registerMechanic } from "./index"
import type { MechanicEvent, MechanicSetup, TimelineMechanic } from "./types"

const PARAM = "moraleChant"
const YI_RIVER_TIER = 6

type State = { tier: number }

function stacksAt(setup: MechanicSetup, timeSec: number): [number, boolean] {
  const inQiBreak = setup.qiPhaseAt(timeSec) === "exhausted"
  return [moraleStacksAtTime(timeSec, inQiBreak), inQiBreak]
}

function effectsFor(stacks: number, inQiBreak: boolean) {
  return [
    { statKey: "allDamageBoost" as const, amount: stacks * moraleDmgPerStack(inQiBreak) },
    { statKey: "phys.penetration" as const, amount: stacks * MORALE_PEN_PER_STACK },
  ]
}

export const moraleMechanic: TimelineMechanic<State> = {
  id: PARAM,

  prepare(setup) {
    if (!setup.hasBuffEngine || !setup.paramOn(PARAM)) return null
    return { tier: setup.paramTier(PARAM) }
  },

  contributeAt(_state, frame, _skill, setup) {
    const [stacks, inQiBreak] = stacksAt(setup, frame / setup.fps)
    if (stacks <= 0) return null
    return { effects: effectsFor(stacks, inQiBreak) }
  },

  extraEvents(state, setup) {
    if (state.tier < YI_RIVER_TIER) return []
    const durationSec = setup.rotationDurationSec
    let first = 0
    while (first < durationSec && stacksAt(setup, first)[0] < MORALE_STACK_THRESHOLD) first += 0.5
    if (first > durationSec) return []

    const skill: Skill = {
      id: "yi-river",
      classId: setup.classId,
      name: "Yi River",
      skillType: "mindMethod",
      weaponOrAttribute: "",
      attributeAttack: "",
      hits: [],
      castFrames: 0,
      triggerable: false,
      createdAt: "1970-01-01T00:00:00.000Z",
      updatedAt: "1970-01-01T00:00:00.000Z",
    }
    const events: MechanicEvent[] = []
    for (let t = first; t <= durationSec; t += YI_RIVER_INTERVAL_SEC) {
      events.push({
        frame: Math.round(t * setup.fps),
        skill,
        art: {
          name: "Yi River",
          physMultiplier: 1,
          attributeMultiplier: 1,
          skillType: "mindMethod",
        },
        name: "Yi River",
        type: "mindMethod",
      })
    }
    return events
  },

  display(_state, timeSec, _prePull, setup) {
    const [stacks, inQiBreak] = stacksAt(setup, timeSec)
    if (stacks <= 0) return []
    return [
      {
        id: PARAM,
        name: "Morale Chant",
        stacks,
        maxStacks: MORALE_MAX_STACKS,
        effects: effectsFor(stacks, inQiBreak),
      },
    ]
  },
}

registerMechanic(moraleMechanic, MECHANIC_ORDER.morale)
