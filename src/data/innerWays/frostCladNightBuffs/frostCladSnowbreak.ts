import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { stat } from "../../../engine/effects/effect"

export const frostCladSnowbreak = defineBuff({
  id: BUFF.frostCladSnowbreak,
  name: "Frost-Clad Night (Snowbreak)",
  requires: { param: PARAM.frostCladNight },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +36%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.36)] : []),
})
