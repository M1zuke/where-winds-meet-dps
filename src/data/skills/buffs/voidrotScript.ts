import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-11.
export const voidrotScript = defineBuff({
  id: BUFF.voidrotScript,
  name: "Voidrot Script",
  requires: { param: PARAM.voidrotScript },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +10% while the target's Qi is low",
  effects: (ctx) => (ctx.target.qiFraction < 0.4 ? [stat("affinityDamageBoost", 0.1)] : []),
})
