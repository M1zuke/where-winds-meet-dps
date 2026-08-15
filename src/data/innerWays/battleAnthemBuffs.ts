import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// The reference workbook offers this at three endurance tiers — 17%, 20% and
// 25% — and its speed rotation runs the highest on 40 of 71 rows.
export const battleAnthemEnduranceBoost = defineClassBuff({
  id: BUFF.battleAnthemEnduranceBoost,
  name: "Battle Anthem",
  requires: { param: PARAM.battleAnthem },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +25%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.25)] : []),
})
