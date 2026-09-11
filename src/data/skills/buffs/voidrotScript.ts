import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-11. The engine has no target Qi-percentage
// model, so this rides the declared low-Qi lead plus the break window in
// place of the gate's true "target Qi below 40%" — see clockQiPhase.
export const voidrotScript = defineBuff({
  id: BUFF.voidrotScript,
  name: "Voidrot Script",
  requires: { param: PARAM.voidrotScript },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +10% while the target's Qi is low",
  effects: (ctx) => (ctx.phase === "normal" ? [] : [stat("affinityDamageBoost", 0.1)]),
})
