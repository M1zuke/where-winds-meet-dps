import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// Tier 4 raises the ladder's charged-skill bonus from 10% to 15%: "Increases
// Charged Skills' damage against all enemies (including players with less than
// 60% Endurance) by 15%" (in-game tier panel, 2026-08-15). Tier 0 states the
// same effect at 10% against bosses, which is the target this engine simulates.
export const battleAnthemChargedDamage = defineBuff({
  id: BUFF.battleAnthemChargedDamage,
  name: "Battle Anthem (Charged Skills)",
  requires: { param: PARAM.battleAnthem },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10%, +15% from tier 4",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [stat("allDamageBoost", ctx.build.paramTier(PARAM.battleAnthem) >= 4 ? 0.15 : 0.1)]
      : [],
})

// Tier 6: "if the target is a boss, deals bonus damage based on the Endurance
// you have consumed: 2% bonus damage for every 10 Endurance consumed, up to
// 10%" (in-game tier panel, 2026-08-15). Carried at the cap, the way the
// reference workbook's speed rotation runs it.
export const battleAnthemEnduranceBoost = defineBuff({
  id: BUFF.battleAnthemEnduranceBoost,
  name: "Battle Anthem (Endurance consumed)",
  requires: { param: PARAM.battleAnthem, minTier: 6 },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.1)] : []),
})
