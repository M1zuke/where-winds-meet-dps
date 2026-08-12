import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { CAST } from "../../skills/ids"

// A stack pool the Snowparting casts spend, not a damage modifier of its own —
// `effects` is empty and the magnitude lives with whichever def consumes it.
export const innerPassion = defineClassBuff({
  id: BUFF.innerPassion,
  name: "Inner Passion",
  triggeredBy: [CAST.snowpartingSpecial],
  affects: null,
  duration: 12,
  maxStacks: 4,
  buffAppliesOnCastEnd: true,
  stacks: (ctx) =>
    ctx.build.param(PARAM.frostCladNight) && ctx.build.paramTier(PARAM.frostCladNight) >= 4 ? 4 : 1,
  effects: [],
})
