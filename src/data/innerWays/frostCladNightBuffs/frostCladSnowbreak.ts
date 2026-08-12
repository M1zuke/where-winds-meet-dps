import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.snowpartingVC]

export const frostCladSnowbreak = defineClassBuff({
  id: BUFF.frostCladSnowbreak,
  name: "Frost-Clad Night (Snowbreak)",
  requires: { param: PARAM.frostCladNight },
  affects: AFFECTS,
  triggeredBy: [],
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +36%",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS }))
      return []
    return [stat("allDamageBoost", 0.36)]
  },
})
