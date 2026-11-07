import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-10-18.
export const insightScript = defineBuff({
  id: BUFF.insightScript,
  name: "Insight Script",
  requires: {
    param: PARAM.insightScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.insightScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "allMysticBoost +15% while the target's health is above 60%",
  effects: (ctx) => (ctx.target.remainingHealthFraction > 0.6 ? [stat("allMysticBoost", 0.15)] : []),
})
