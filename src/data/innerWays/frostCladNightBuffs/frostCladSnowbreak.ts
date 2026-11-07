import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { damageMultiplier } from "../../../engine/effects/effect"

export const frostCladSnowbreak = defineBuff({
  id: BUFF.frostCladSnowbreak,
  name: "Frost-Clad Night (Snowbreak)",
  requires: { param: PARAM.frostCladNight },
  alwaysActive: true,
  duration: 9999,
  summary: "Snowbreak Spring ×1.36 against non-player targets",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(1.36)] : []),
})
