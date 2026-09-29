import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// Nameless Sword talent node 5, always on — in-game values as of 2026-09-25.
export const qiStruggleEnhancement = defineClassBuff({
  id: BUFF.qiStruggleEnhancement,
  name: "Qi Struggle Enhancement",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "qiDamageBoost +10%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("qiDamageBoost", 0.1)] : []),
})
