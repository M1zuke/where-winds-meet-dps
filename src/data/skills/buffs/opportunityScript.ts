import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-10-18.
export const opportunityScript = defineBuff({
  id: BUFF.opportunityScript,
  name: "Opportunity Script",
  requires: {
    param: PARAM.opportunityScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.opportunityScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDmg +10% while the target's health is at or below 40%",
  effects: (ctx) => (ctx.target.remainingHealthFraction <= 0.4 ? [stat("critDamageBoost", 0.1)] : []),
})
