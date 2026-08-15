import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// Carries no damage of its own — it is the window the Forgetfulness variant of
// Snowparting Charged is authored against.
export const forgetfulness = defineClassBuff({
  id: BUFF.forgetfulness,
  name: "Forgetfulness",
  requires: { param: PARAM.frostCladNight, minTier: 6 },
  affectsAll: true,
  duration: 3,
  cooldown: 6,
  effects: [],
})
