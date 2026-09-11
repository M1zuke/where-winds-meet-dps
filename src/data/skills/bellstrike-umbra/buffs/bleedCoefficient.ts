import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { damageMultiplier } from "../../../../engine/effects/effect"

// In-game talent text as of 2026-09-10: "Increases the power coefficients of
// Bleeding and High Bleeding." It scales the coefficient, so folding it into
// the additive damage-boost sum would be a different, smaller number.
const COEFFICIENT_SCALE = 1.03

export const bellstrikeUmbraBleedCoefficient = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedCoefficient,
  name: "Bleed Power Coefficient",
  requires: { param: PARAM.swordHorizon },
  alwaysActive: true,
  duration: 9999,
  summary: "Bleeding and Blood Burst ×1.03",
  effects: (ctx) => (ctx.self.reachesEvent ? [damageMultiplier(COEFFICIENT_SCALE)] : []),
})
