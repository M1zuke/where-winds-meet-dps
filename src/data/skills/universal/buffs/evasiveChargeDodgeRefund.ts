import { meterDelta } from "../../../../definitions/skills/triggers"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { PARAM } from "../../buffs/ids"

// Rank 1's own grant is ambiguous between a 20% and a 50% chance of a full
// refund; the 50% row is the one the inner way's own base entry names, so it
// is the reading used here. Ranks 2-6 share a flat 70% chance. Each dodge is
// an independent, uncooled roll rather than one a cooldown eventually
// guarantees, so the refund is authored as its expected value — chance times
// the dodge's own actually-paid Endurance cost — rather than the modal
// full-refund amount docs/TIMELINE.md § "Meters" otherwise calls for. Rank
// 2's own jump to 70% is authored as the additional expected value on top of
// rank 1's, so the two triggers sum to the right total from tier 2 on
// without double-counting rank 1's own share.
export const EVASIVE_CHARGE_DODGE_REFUND_BASE = meterDelta({
  target: enduranceMeter.id,
  refundFractionOfCastCost: 0.5,
  requiresParam: PARAM.evasiveCharge,
})

export const EVASIVE_CHARGE_DODGE_REFUND_TIER2 = meterDelta({
  target: enduranceMeter.id,
  refundFractionOfCastCost: 0.2,
  requiresParam: PARAM.evasiveCharge,
  requiresMinTier: 2,
})

export const EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS = [
  EVASIVE_CHARGE_DODGE_REFUND_BASE,
  EVASIVE_CHARGE_DODGE_REFUND_TIER2,
]
