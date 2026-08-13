import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.snowpartingVC]

export const frostCladSnowbreakT6 = defineClassBuff({
  id: BUFF.frostCladSnowbreakT6,
  name: "Frost-Clad Night T6 (Snowbreak)",
  requires: { param: PARAM.frostCladNight, minTier: 6 },
  affects: AFFECTS,
  triggeredBy: [],
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10%",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS }))
      return []
    return [stat("allDamageBoost", 0.1)]
  },
})
