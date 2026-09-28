import { meterDelta } from "../../../../definitions/skills/triggers"
import { PARAM } from "../../buffs/ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-25: Qiankun's Lock itself always grants +30
// Endurance; Mountain's Might adds a further +30 while its own talent is
// slotted.
export const QIANKUNS_LOCK_GAIN = meterDelta({ target: enduranceMeter.id, stacks: 30 })
export const MOUNTAINS_MIGHT_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 30,
  requiresParam: PARAM.mountainsMight,
})
