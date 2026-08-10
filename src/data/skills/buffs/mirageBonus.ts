import { defineBuff } from "./define"
import { BUFF } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const mirageBonus = defineBuff({
  id: BUFF.mirageBonus,
  name: "Mirage Bonus",
  triggeredBy: [CAST.perfectDodge, CAST.perfectDodgeFull],
  duration: 8,
  requiresBuffActive: BUFF.mirage,
  effects: [stat("allDamageBoost", 0.15)],
})
