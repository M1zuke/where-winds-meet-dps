import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { echo } from "../../engine/effects/effect"
import { DEBUFF } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// From tier 6, Inebriate-enhanced skill damage feeds Drunkslay's echo, and
// the echo counts as repeated damage, which a target under both Wildstride
// and Strayhunt takes 20% more of (in-game inner-way text, 2026-09-06).
export const drunkslayEcho = defineBuff({
  id: BUFF.drunkslayEcho,
  name: "Drunkslay",
  requires: { param: PARAM.skyspeak, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  summary:
    "Inebriate-enhanced skill damage feeds the Drunkslay echo while the mark is on the target, ×1.2 with Wildstride and Strayhunt on it",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx) || !ctx.status.isActive(DEBUFF.drunkslay))
      return []
    const repeatedDamageBoosted =
      ctx.status.isActive(DEBUFF.wildstride) && ctx.status.isActive(DEBUFF.strayhunt)
    return [echo(DEBUFF.drunkslay, repeatedDamageBoosted ? 1.2 : 1)]
  },
})
