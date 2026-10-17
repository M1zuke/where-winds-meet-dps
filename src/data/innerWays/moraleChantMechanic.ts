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
import type { MechanicHost, MechanicSetup, TimelineMechanic } from "../../engine/mechanics/types"
import { innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
// This import must stay above `./moraleChant`: that module eagerly calls
// `moraleChantMechanic()` while cyclically re-entering this file, and the
// returned object dereferences `PARAM` immediately — an import after
// `./moraleChant` in source order would still be in TDZ at that point.
import { moraleChant } from "./moraleChant"

interface State {
  yiRiver: Skill | null
  nextYiRiverSec: number | null
}

const YI_RIVER_SEARCH_LIMIT_SEC = 3600

// In-game rule as of 2026-09-24: the doubling needs a controlled target, and
// a training stake is never one.
function stacksAt(_setup: MechanicSetup, timeSec: number): [number, boolean] {
  const controlled = false
  return [moraleStacksAtTime(timeSec, controlled), controlled]
}

function effectsFor(stacks: number, controlled: boolean) {
  return [
    { statKey: "allDamageBoost" as const, amount: stacks * moraleDmgPerStack(controlled) },
    { statKey: "phys.penetration" as const, amount: stacks * MORALE_PEN_PER_STACK },
  ]
}

function yiRiverSkill(classId: string): Skill {
  return {
    id: "yi-river",
    classId,
    name: "Yi River",
    breakdownName: "Morale Chant",
    skillType: "mindMethod",
    weaponOrAttribute: "",
    attributeAttack: "",
    hits: [],
    castFrames: 0,
    triggerable: false,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  }
}

function scheduleYiRiver(state: State, host: MechanicHost, setup: MechanicSetup): void {
  if (!state.yiRiver || state.nextYiRiverSec === null) return
  host.scheduleExtra({
    frame: Math.round(state.nextYiRiverSec * setup.fps),
    skill: state.yiRiver,
    art: {
      name: "Yi River",
      physMultiplier: 1,
      // In-game values as of 2026-10-06: a passive hit carries no martial art.
      attributeMultiplier: 1,
      skillType: "mindMethod",
    },
    name: "Yi River",
    type: "mindMethod",
    direct: true,
  })
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
      const hasYiRiver = innerWayHasNode(
        moraleChant,
        setup.paramTier(PARAM.moraleChant),
        INNER_WAY_NODE.yiRiver,
      )
      return {
        yiRiver: hasYiRiver ? yiRiverSkill(setup.classId) : null,
        nextYiRiverSec: null,
      }
    },

    contributeAt(_state, frame, _skill, setup) {
      const [stacks, controlled] = stacksAt(setup, frame / setup.fps)
      if (stacks <= 0) return null
      return { effects: effectsFor(stacks, controlled) }
    },

    start(state, host, setup) {
      if (!state.yiRiver) return
      let first = 0
      while (
        first < YI_RIVER_SEARCH_LIMIT_SEC &&
        stacksAt(setup, first)[0] < MORALE_STACK_THRESHOLD
      )
        first += 0.5
      if (first >= YI_RIVER_SEARCH_LIMIT_SEC) return
      state.nextYiRiverSec = first
      scheduleYiRiver(state, host, setup)
    },

    afterExtraEvent(state, event, host, setup) {
      if (event.skill !== state.yiRiver || state.nextYiRiverSec === null) return
      state.nextYiRiverSec += YI_RIVER_INTERVAL_SEC
      scheduleYiRiver(state, host, setup)
    },

    display(_state, timeSec, _prePull, setup) {
      const [stacks, controlled] = stacksAt(setup, timeSec)
      if (stacks <= 0) return []
      return [
        {
          id: PARAM.moraleChant,
          name: "Morale Chant",
          stacks,
          maxStacks: MORALE_MAX_STACKS,
          effects: effectsFor(stacks, controlled),
        },
      ]
    },
  }
}
