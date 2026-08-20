import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { artBonus, stat } from "../../../../engine/effects/effect"

// "Against targets with below 30% Qi, increases Heavy Attack Pursuit Moon
// Shatter Spring's Critical Rate by 30% and HP damage by 8%." (in-game Martial
// Arts Talents panel, Inkwell Fan, 2026-08-15.) Every low-Qi source the sim
// models reports a non-`normal` phase.
export const lowQiFollowUp = defineClassBuff({
  id: BUFF.lowQiFollowUp,
  name: "Low Qi Follow-up",
  alwaysActive: true,
  duration: 9999,
  summary: "crit rate +30%, damage +8% — targets below 30% Qi only",
  effects: (ctx) =>
    ctx.phase === "normal" ? [] : [artBonus("extraCritRate", 0.3), stat("allDamageBoost", 0.08)],
})
