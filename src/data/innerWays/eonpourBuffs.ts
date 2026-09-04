import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { STATUS } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// Every Bamboocut - Draught skill, against non-player units while Inebriate:
// +10% base damage at tiers 1-3, +20% from tier 4, and +40% during Deepdaze
// at tier 6 (client locale text, 2026-09-04).
export const eonpourInebriateDamage = defineBuff({
  id: BUFF.eonpourInebriateDamage,
  name: "Eonpour",
  requires: { param: PARAM.eonpour },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10% while Inebriate, +20% from tier 4, +40% during Deepdaze at tier 6",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx)) return []
    const tier = ctx.build.paramTier(PARAM.eonpour)
    if (tier >= 6 && ctx.status.isActive(STATUS.inebriateDeepdaze))
      return [stat("allDamageBoost", 0.4)]
    return [stat("allDamageBoost", tier >= 4 ? 0.2 : 0.1)]
  },
})
