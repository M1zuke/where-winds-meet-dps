import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { DEBUFF } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// From tier 4, Hero's Blood marks its target with Drunkslay for 20 s and 20%
// of Inebriate-enhanced skill damage is dealt again immediately; at tier 6 that
// echo counts as repeated damage, which a target under both Wildstride and
// Strayhunt takes 20% more of (client locale text, 2026-09-04).
export const drunkslayEcho = defineBuff({
  id: BUFF.drunkslayEcho,
  name: "Drunkslay",
  requires: { param: PARAM.skyspeak, minTier: 4 },
  alwaysActive: true,
  duration: 9999,
  summary:
    "allDamageBoost +20% on Inebriate-enhanced skills while Drunkslay marks the target, +24% at tier 6 with Wildstride and Strayhunt on it",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx) || !ctx.status.isActive(DEBUFF.drunkslay))
      return []
    const repeatedDamageBoosted =
      ctx.build.paramTier(PARAM.skyspeak) >= 6 &&
      ctx.status.isActive(DEBUFF.wildstride) &&
      ctx.status.isActive(DEBUFF.strayhunt)
    return [stat("allDamageBoost", repeatedDamageBoosted ? 0.24 : 0.2)]
  },
})
