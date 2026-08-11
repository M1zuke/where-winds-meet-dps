import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"

// Models the 45 % cap only: there is no HP-percentage input, so the toggle
// means "assume maximum HP lost" rather than scaling with a live HP value.
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
