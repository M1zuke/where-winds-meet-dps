import { meterDelta } from "../../../../definitions/skills/triggers"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { PARAM } from "../../buffs/ids"

// In-game values as of 2026-09-28: a Perfect Dodge unconditionally restores a
// flat +5 Endurance while the 4-piece gear-set bonus is equipped — no roll,
// unlike the inner way that shares this same trigger point.
export const CALMWATERS_PERFECT_DODGE_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 5,
  requiresParam: PARAM.calmwatersSet,
})
