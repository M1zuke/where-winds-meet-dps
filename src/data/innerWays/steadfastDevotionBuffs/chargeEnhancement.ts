import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// A stack pool Burning Heart spends; the magnitude lives with the def that
// consumes it, so this one carries no effects.
export const chargeEnhancement = defineBuff({
  id: BUFF.chargeEnhancement,
  name: "Charge Enhancement",
  requires: { param: PARAM.steadfastDevotion, minTier: 6 },
  triggerPhase: "exhausted",
  affectsAll: true,
  duration: 18,
  maxStacks: 3,
  buffAppliesOnCastEnd: true,
  cooldown: 30,
  stacks: () => 3,
  effects: [],
})
