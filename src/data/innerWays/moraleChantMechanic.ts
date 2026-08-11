// Morale Chant's stack curve, and — at tier 6 — Yi River, a periodic hit that
// takes no weapon or mystic boosts (`.tmp/site/deobfuscated.js`
// `yiRiver.calculate` ~L21287-21409).
import type { Skill } from "../../engine/skill"
import {
  MORALE_MAX_STACKS,
  MORALE_PEN_PER_STACK,
  MORALE_STACK_THRESHOLD,
  YI_RIVER_INTERVAL_SEC,
  moraleDmgPerStack,
  moraleStacksAtTime,
} from "../../engine/buffs/morale"
import type { MechanicEvent, MechanicSetup, TimelineMechanic } from "../../engine/mechanics/types"
import { innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
// This import must stay above `./moraleChant`: that module eagerly calls
// `moraleChantMechanic()` while cyclically re-entering this file, and the
// returned object dereferences `PARAM` immediately — an import after
// `./moraleChant` in source order would still be in TDZ at that point.
import { moraleChant } from "./moraleChant"

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

// A hoisted factory, not a plain object: `moraleChant.ts` declares this as its
// mechanic, so this file's own top-level export must be safe to call before
// `./moraleChant`'s cyclic import back into this module has finished — a
// function declaration is, an object literal bound to a `const` is not.
export function moraleChantMechanic(): TimelineMechanic<State> {
  return {
    id: PARAM.moraleChant,

    prepare(setup) {
      if (!setup.hasBuffEngine || !setup.paramOn(PARAM.moraleChant)) return null
      return { tier: setup.paramTier(PARAM.moraleChant) }
    },

    contributeAt(_state, frame, _skill, setup) {
      const [stacks, inQiBreak] = stacksAt(setup, frame / setup.fps)
      if (stacks <= 0) return null
      return { effects: effectsFor(stacks, inQiBreak) }
    },

    extraEvents(state, setup) {
      if (!innerWayHasNode(moraleChant, state.tier, INNER_WAY_NODE.yiRiver)) return []
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
          id: PARAM.moraleChant,
          name: "Morale Chant",
          stacks,
          maxStacks: MORALE_MAX_STACKS,
          effects: effectsFor(stacks, inQiBreak),
        },
      ]
    },
  }
}
