import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-10-18.
export const detachmentScript = defineBuff({
  id: BUFF.detachmentScript,
  name: "Detachment Script",
  requires: {
    param: PARAM.detachmentScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.detachmentScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +10% while the target's health is at or below 40%",
  effects: (ctx) => (ctx.target.remainingHealthFraction <= 0.4 ? [stat("affinityDamageBoost", 0.1)] : []),
})
