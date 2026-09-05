import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// From tier 5, a further 6 penetration of every type while Inebriate, on top
// of the flat 6 the panel carries (in-game inner-way text, 2026-09-05).
export const mistwingInebriatePenetration = defineBuff({
  id: BUFF.mistwingInebriatePenetration,
  name: "Mistwing",
  requires: { param: PARAM.mistwing, minTier: 5 },
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +6, bamboocut.penetration +6 while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("phys.penetration", 0.06), stat("bamboocut.penetration", 0.06)]
      : [],
})
