import { meterDelta } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-26: +8 Endurance per charged hit against a
// target holding Qi Imbalance, Mountain's Might tier 6 only, at most once
// per 2 s.
export const MOUNTAINS_MIGHT_CHARGED_HIT_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 8,
  condition: { buffId: BUFF.qiImbalanceMarker, op: "gte", stacks: 1 },
  cooldownFrames: 120,
  cooldownGroup: "mountainsMightChargedHitGain",
  requiresParam: PARAM.mountainsMight,
  requiresMinTier: 6,
})
