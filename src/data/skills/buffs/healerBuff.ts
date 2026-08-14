import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// The display chip shows the flat 20% — `phaseBonus` only ever applied to
// damage, matching `activeBuffsForDisplay`'s pre-conversion behaviour.
export const healerBuff = defineBuff({
  id: BUFF.healerBuff,
  name: "Healer Buff",
  affectsAll: true,
  duration: 12,
  buffAppliesOnCastEnd: true,
  // "(team)" is the pre-conversion `groupDamage` bonus label — the only
  // signal in the catalog that this is a party-wide bonus, not a solo one.
  summary: "+20.0% all (team)",
  effects: (ctx) => {
    if (ctx.event.kind === "cast") return []
    if (ctx.event.kind !== "damage") return [stat("allDamageBoost", 0.2)]
    return [stat("allDamageBoost", 0.2 + (ctx.phase === "exhausted" ? 0.05 : 0))]
  },
})
