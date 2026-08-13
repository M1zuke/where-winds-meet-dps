import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { CAST } from "../../skills/ids"

// A stack pool Burning Heart spends; the magnitude lives with the def that
// consumes it, so this one carries no effects.
export const chargeEnhancement = defineClassBuff({
  id: BUFF.chargeEnhancement,
  name: "Charge Enhancement",
  requires: { param: PARAM.steadfastDevotion, minTier: 6 },
  triggeredBy: [CAST.phalanxChargedS3, CAST.phalanxChargedS3InnerPassion],
  triggerPhase: "exhausted",
  affects: null,
  duration: 18,
  maxStacks: 3,
  buffAppliesOnCastEnd: true,
  rateLimit: { count: 3, window: 30 },
  stacks: () => 3,
  effects: [],
})
