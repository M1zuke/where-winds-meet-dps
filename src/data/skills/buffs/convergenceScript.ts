import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-10-18.
export const convergenceScript = defineBuff({
  id: BUFF.convergenceScript,
  name: "Convergence Script",
  requires: {
    param: PARAM.convergenceScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.convergenceScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "attributeDmg +15% while the target's Qi is at or above 60%",
  effects: (ctx) => (ctx.target.qiFraction >= 0.6 ? [stat("attributeDamageBoost", 0.15)] : []),
})
