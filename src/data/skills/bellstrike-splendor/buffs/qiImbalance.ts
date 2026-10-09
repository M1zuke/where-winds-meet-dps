import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { damageMultiplier, stat } from "../../../../engine/effects/effect"

// "Increases all Qi damage taken by 10% for 15 seconds. Increases HP damage
// taken by 10%, and Bellstrike damage taken is increased by an additional 10%
// while in the Exhausted state" (in-game English text, 2026-08-15). The 25 June
// 2026 patch note carries the latter two at 8%; the discrepancy is unresolved
// and the localization postdates the note.
//
export const qiImbalance = defineClassBuff({
  id: BUFF.qiImbalance,
  name: "Qi Imbalance",
  affectsAll: true,
  duration: 15,
  buffAppliesOnCastEnd: true,
  summary: "+10% Qi damage taken; +10% HP damage and +10% Bellstrike damage taken while Exhausted",
  effects: (ctx) => [
    stat("target.qiDamageTaken", 0.1),
    ...(ctx.phase === "exhausted"
      ? [damageMultiplier(1.1), stat("attributeDamageBoost", 0.1)]
      : []),
  ],
})
