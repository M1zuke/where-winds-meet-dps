import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { artBonus, critQiDamage, stat } from "../../../../engine/effects/effect"

// "Against targets with below 30% Qi, increases Heavy Attack Pursuit Moon
// Shatter Spring's Critical Rate by 30% and HP damage by 8%." (in-game Martial
// Arts Talents panel, Inkwell Fan, 2026-08-15.) In-game values as of 2026-11-10:
// a critical hit of that skill on such a target also deals 5 Qi damage 0.1 s
// later, read against the Qi the hit itself leaves behind.
export const lowQiFollowUp = defineClassBuff({
  id: BUFF.lowQiFollowUp,
  name: "Low Qi Follow-up",
  alwaysActive: true,
  duration: 9999,
  summary:
    "crit rate +30%, damage +8%, a critical hit deals 5 extra Qi — targets below 30% Qi only",
  effects: (ctx) => [
    ...(ctx.target.qiFraction < 0.3
      ? [artBonus("extraCritRate", 0.3), stat("allDamageBoost", 0.08)]
      : []),
    critQiDamage(5, 0.3),
  ],
})
