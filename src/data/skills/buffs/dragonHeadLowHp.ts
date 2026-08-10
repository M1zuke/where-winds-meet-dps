import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const dragonHeadLowHp = defineBuff({
  id: BUFF.dragonHeadLowHp,
  name: "Low HP Bonus (Dragon Head)",
  requires: { param: PARAM.dragonHeadLowHpMaxBonus },
  triggeredBy: [],
  duration: 9999,
  alwaysActive: true,
  affects: [ROLE.dragonHeadPlus],
  effects: [stat("allDamageBoost", 0.45)],
})
