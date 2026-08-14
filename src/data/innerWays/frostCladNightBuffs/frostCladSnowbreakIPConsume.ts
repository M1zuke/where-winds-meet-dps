import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { PROP } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"

// The bonus lands on a cast that actually spent an Inner Passion stack, so it
// is scoped to that cast rather than opening a window — hence `duration: 0`.
// At tier 6 the exhausted phase is an alternative route to the same bonus.
export const frostCladSnowbreakIPConsume = defineClassBuff({
  id: BUFF.frostCladSnowbreakIPConsume,
  name: "Frost-Clad Night T4 (IP Consume)",
  requires: { param: PARAM.frostCladNight, minTier: 4 },
  duration: 0,
  perCastConsume: {
    property: PROP.consumesInnerPassion,
    from: BUFF.innerPassion,
    phaseAlternative: {
      phase: "exhausted",
      requires: { param: PARAM.frostCladNight, minTier: 6 },
    },
  },
  summary: "bossBoost +40% on a cast that consumes Inner Passion",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("bossBoost", 0.4)] : []),
})
