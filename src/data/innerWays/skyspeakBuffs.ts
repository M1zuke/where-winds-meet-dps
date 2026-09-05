import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { echo } from "../../engine/effects/effect"
import { DEBUFF } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// From tier 4, Inebriate-enhanced skill damage feeds Drunkslay's echo; at tier
// 6 the echo counts as repeated damage, which a target under both Wildstride
// and Strayhunt takes 20% more of (in-game skill text, 2026-09-04).
export const drunkslayEcho = defineBuff({
  id: BUFF.drunkslayEcho,
  name: "Drunkslay",
  requires: { param: PARAM.skyspeak, minTier: 4 },
  alwaysActive: true,
  duration: 9999,
  summary:
    "Inebriate-enhanced skill damage feeds the Drunkslay echo while the mark is on the target, ×1.2 at tier 6 with Wildstride and Strayhunt on it",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx) || !ctx.status.isActive(DEBUFF.drunkslay))
      return []
    const repeatedDamageBoosted =
      ctx.build.paramTier(PARAM.skyspeak) >= 6 &&
      ctx.status.isActive(DEBUFF.wildstride) &&
      ctx.status.isActive(DEBUFF.strayhunt)
    return [echo(DEBUFF.drunkslay, repeatedDamageBoosted ? 1.2 : 1)]
  },
})
