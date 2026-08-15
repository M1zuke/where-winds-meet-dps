import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

export const ironGuards = defineClassBuff({
  id: BUFF.ironGuards,
  name: "Iron Guards",
  affectsAll: true,
  duration: 40,
  cooldown: 20,
  // The pre-conversion `BuffDef` rendered the two penetrations as points, not
  // the app's internal fraction — pin the Skill Editor text to that unit.
  summary: "allDamageBoost +8%, physPen +12, stonesplitPen +12",
  effects: [
    stat("allDamageBoost", 0.08),
    stat("phys.penetration", 0.12),
    stat("stonesplit.penetration", 0.12),
  ],
})
