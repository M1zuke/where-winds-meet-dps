import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const potentRiverFlow = defineBuff({
  id: BUFF.potentRiverFlow,
  name: "Potent River Flow",
  specs: ["bellstrike_umbra"],
  requires: { param: PARAM.wolfchasersArt },
  triggeredBy: [CAST.spearQ, CAST.spearQ0HitCancel, CAST.spearQ5HitCancel, CAST.spearQPrepull],
  duration: 15,
  buffAppliesOnCastEnd: true,
  effects: [stat("allDamageBoost", 0.25)],
})
