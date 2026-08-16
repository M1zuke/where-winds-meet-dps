import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { damageMultiplier, stat } from "../../../../engine/effects/effect"

// "Increases all Qi damage taken by 10% for 15 seconds. Increases HP damage
// taken by 10%, and Bellstrike damage taken is increased by an additional 10%
// while in the Exhausted state" (client localization, 2026-08-15). The 25 June
// 2026 patch note carries the latter two at 8%; the discrepancy is unresolved
// and the localization postdates the note.
//
// Only the two Exhausted-state clauses are modelled: Qi damage drains the
// target's Qi bar rather than its HP, so it reaches no damage stat here.
//
// Returning no effects does not make this inert — sharing
// `QI_IMBALANCE_STATUS`'s value is what holds the target in the low-Qi phase
// for as long as it is up.
export const qiImbalance = defineClassBuff({
  id: BUFF.qiImbalance,
  name: "Qi Imbalance",
  affectsAll: true,
  duration: 15,
  buffAppliesOnCastEnd: true,
  summary: "+10% HP damage and +10% Bellstrike damage taken while Exhausted",
  effects: (ctx) =>
    ctx.phase === "exhausted" ? [damageMultiplier(1.1), stat("attributeDamageBoost", 0.1)] : [],
})
