import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { CAST } from "../../skills/ids"

// Carries no damage of its own — it is the window the Forgetfulness variant of
// Snowparting Charged is authored against.
export const forgetfulness = defineClassBuff({
  id: BUFF.forgetfulness,
  name: "Forgetfulness",
  requires: { param: PARAM.frostCladNight, minTier: 6 },
  triggeredBy: [
    CAST.snowpartingVC,
    CAST.snowpartingVCPrepull,
    CAST.snowpartingCharged,
    CAST.snowpartingChargedForgetfulness,
    CAST.snowpartingDual,
    CAST.snowpartingDualPrepull,
    CAST.deflect,
  ],
  affects: null,
  duration: 3,
  cooldown: 6,
  effects: [],
})
