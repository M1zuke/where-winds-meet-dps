import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { CAST } from "../../ids"
import { stat } from "../../../../engine/effects/effect"

export const wineGu = defineClassBuff({
  id: BUFF.wineGu,
  name: "Wine Gu",
  requires: { param: PARAM.wolfchasersArt, minTier: 6 },
  triggeredBy: [CAST.spearQ, CAST.spearQ0HitCancel, CAST.spearQ5HitCancel, CAST.spearQPrepull],
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [stat("allDamageBoost", 0.05)],
})
