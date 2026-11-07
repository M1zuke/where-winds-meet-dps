import { meterDelta } from "../../../../definitions/skills/triggers"
import { PARAM } from "../../buffs/ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-25: Qiankun's Lock itself always grants +30
// Endurance 0.01 s into the cast; Mountain's Might adds a further +30 at the
// cast's start while its own talent is slotted.
export const QIANKUNS_LOCK_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 30,
  delayFrames: 0.6,
})
export const MOUNTAINS_MIGHT_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 30,
  requiresParam: PARAM.mountainsMight,
})
