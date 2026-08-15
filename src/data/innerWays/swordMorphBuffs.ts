import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// "Unleashing multiple sword energy attacks consumes additional Endurance to
// increase damage by 1.5% per point consumed, up to 30%" (client localization,
// 2026-08-15). The rotation spends the full 20 points, so this sits at the cap
// — the reference workbook models it the same way, as a picked row rather than
// a simulated resource.
export const swordMorphEnduranceBoost = defineClassBuff({
  id: BUFF.swordMorphEnduranceBoost,
  name: "Extra Endurance",
  requires: { param: PARAM.swordMorph },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +30%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.3)] : []),
})
