import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { HEALER_BUFF_AMOUNT } from "./healerBuffAmounts"

export const healerBuff = defineBuff({
  id: BUFF.healerBuff,
  name: "Healer Buff",
  affectsAll: true,
  duration: 12,
  buffAppliesOnCastEnd: true,
  // "(team)" is the pre-conversion `groupDamage` bonus label — the only
  // signal in the catalog that this is a party-wide bonus, not a solo one.
  summary: "+10.0% all (team)",
  effects: (ctx) => (ctx.event.kind === "cast" ? [] : [stat("allDamageBoost", HEALER_BUFF_AMOUNT)]),
})
