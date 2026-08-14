import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { stat } from "../../../engine/effects/effect"

export const frostCladSnowbreakT6 = defineClassBuff({
  id: BUFF.frostCladSnowbreakT6,
  name: "Frost-Clad Night T6 (Snowbreak)",
  requires: { param: PARAM.frostCladNight, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.1)] : []),
})
