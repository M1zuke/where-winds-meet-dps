import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-11.
export const wraithstrikeScript = defineBuff({
  id: BUFF.wraithstrikeScript,
  name: "Wraithstrike Script",
  requires: { param: PARAM.wraithstrikeScript },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDmg +10% while the target's Qi is low",
  effects: (ctx) => (ctx.target.qiFraction < 0.4 ? [stat("critDamageBoost", 0.1)] : []),
})
