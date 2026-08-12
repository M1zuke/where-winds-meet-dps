import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { CAST } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const fluteBoost = defineBuff({
  id: BUFF.fluteBoost,
  name: "Flute DMG Boost",
  triggeredBy: [CAST.fluteOfTheTidesCancel, CAST.fluteOfTheTidesFull, CAST.fluteOfTheTidesPrepull],
  duration: 12.5,
  summary: "+all (from fluteBoostValue)",
  // Omit the effect at 0 rather than emitting a no-op stat — the pre-conversion
  // display path did the same, and the baseline digest pins the exact shape
  // of a cast's buff-chip effects array, not just its numeric sum.
  effects: (ctx) => {
    const value = ctx.build.paramValue(PARAM.fluteBoostValue)
    return value !== 0 ? [stat("allDamageBoost", value)] : []
  },
})
