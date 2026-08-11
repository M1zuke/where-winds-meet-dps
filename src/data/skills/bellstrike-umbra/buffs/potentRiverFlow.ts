import { defineClassBuff } from "../../buffs/define"
import { BUFF, PARAM } from "../../buffs/ids"
import { CAST } from "../../ids"
import { stat } from "../../../../engine/effects/effect"

export const potentRiverFlow = defineClassBuff({
  id: BUFF.potentRiverFlow,
  name: "Potent River Flow",
  requires: { param: PARAM.wolfchasersArt },
  triggeredBy: [CAST.spearQ, CAST.spearQ0HitCancel, CAST.spearQ5HitCancel, CAST.spearQPrepull],
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [stat("allDamageBoost", 0.25)],
})
