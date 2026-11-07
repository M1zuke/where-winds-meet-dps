import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"

// In-game values as of 2026-10-15: 6 s after a Moon Shatter Spring cast starts,
// 4 s from Gourd Toss rank 4.
export const moonShatterSpringLockout = defineClassBuff({
  id: BUFF.moonShatterSpringLockout,
  name: "Moon Shatter Spring Cooldown",
  duration: (ctx) => (ctx.build.paramTier(PARAM.gourdToss) >= 4 ? 4 : 6),
  effects: [],
})
