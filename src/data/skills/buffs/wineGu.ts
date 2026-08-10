import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const wineGu = defineBuff({
  id: BUFF.wineGu,
  name: "Wine Gu",
  specs: ["bellstrike_umbra"],
  requires: { param: PARAM.wolfchasersArt, minTier: 6 },
  triggeredBy: [CAST.spearQ, CAST.spearQ0HitCancel, CAST.spearQ5HitCancel, CAST.spearQPrepull],
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [stat("allDamageBoost", 0.05)],
})
