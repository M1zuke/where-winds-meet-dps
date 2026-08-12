import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { PROP, ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.snowpartingVC]

// The bonus lands on a cast that actually spent an Inner Passion stack, so it
// is scoped to that cast rather than opening a window — hence `duration: 0`.
// At tier 6 the exhausted phase is an alternative route to the same bonus.
export const frostCladSnowbreakIPConsume = defineClassBuff({
  id: BUFF.frostCladSnowbreakIPConsume,
  name: "Frost-Clad Night T4 (IP Consume)",
  requires: { param: PARAM.frostCladNight, minTier: 4 },
  affects: AFFECTS,
  triggeredBy: [],
  duration: 0,
  perCastConsume: { property: PROP.consumesInnerPassion, from: BUFF.innerPassion },
  summary: "bossBoost +40% on a cast that consumes Inner Passion",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS }))
      return []
    return [stat("bossBoost", 0.4)]
  },
})
