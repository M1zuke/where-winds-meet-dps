import { meterDelta } from "../../../../definitions/skills/triggers"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { PARAM } from "../../buffs/ids"

// In-game values as of 2026-11-10: every rank from 1 up refunds the whole
// dodge cost with a 70% chance. Each dodge is an independent, uncooled roll,
// so the refund is authored as its expected value — chance times the dodge's
// own actually-paid Endurance cost — rather than the modal full-refund amount
// docs/TIMELINE.md § "Meters" otherwise calls for.
export const EVASIVE_CHARGE_DODGE_REFUND = meterDelta({
  target: enduranceMeter.id,
  refundFractionOfCastCost: 0.7,
  requiresParam: PARAM.evasiveCharge,
})

export const EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS = [EVASIVE_CHARGE_DODGE_REFUND]
