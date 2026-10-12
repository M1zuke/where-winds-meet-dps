import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { stat } from "../../../../engine/effects/effect"
import { BUFF } from "../../buffs/ids"
import { DEBUFF } from "../ids"

// In-game values as of 2026-10-12: the target of Soulbreak takes 5% more
// damage and 5% more Qi damage from the player who applied it.
export const soulbreakDamageTaken = defineClassBuff({
  id: BUFF.soulbreakDamageTaken,
  name: "Soulbreak",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost and qiDamageBoost +5% while Soulbreak is on the target",
  effects: (ctx) =>
    ctx.status.isActive(DEBUFF.soulbreak)
      ? [stat("allDamageBoost", 0.05), stat("qiDamageBoost", 0.05)]
      : [],
})
