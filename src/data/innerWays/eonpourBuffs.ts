import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { damageMultiplier } from "../../engine/effects/effect"
import { STATUS } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// Every Bamboocut - Draught skill, against non-player units while Inebriate:
// +10% base damage at tiers 1-3, +20% from tier 4, and +40% during Deepdaze
// at tier 6 (in-game inner-way text, 2026-09-04). A base-damage bonus scales
// the skill's own numbers, so it multiplies the hit instead of joining the
// boost sum.
export const eonpourInebriateDamage = defineBuff({
  id: BUFF.eonpourInebriateDamage,
  name: "Eonpour",
  requires: { param: PARAM.eonpour },
  alwaysActive: true,
  duration: 9999,
  summary: "damage ×1.1 while Inebriate, ×1.2 from tier 4, ×1.4 during Deepdaze at tier 6",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx)) return []
    const tier = ctx.build.paramTier(PARAM.eonpour)
    if (tier >= 6 && ctx.status.isActive(STATUS.inebriateDeepdaze)) return [damageMultiplier(1.4)]
    return [damageMultiplier(tier >= 4 ? 1.2 : 1.1)]
  },
})
