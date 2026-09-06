import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// +5% damage dealt with Winebound skills from tier 1, a further +5% at tier
// 6 while above 30% HP (in-game inner-way text, 2026-09-06) — the model keeps
// the player above 30%.
export const volutefitWineboundDamage = defineBuff({
  id: BUFF.volutefitWineboundDamage,
  name: "Volutefit",
  requires: { param: PARAM.volutefit, minTier: 1 },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +5%, +10% at tier 6 — reaches Winebound skills only",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("allDamageBoost", ctx.build.paramTier(PARAM.volutefit) >= 6 ? 0.1 : 0.05)]
      : [],
})
