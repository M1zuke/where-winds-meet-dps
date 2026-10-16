import { defineMeter, meterStatusId } from "../../../definitions/resources/meterDef"
import type { MeterCost, TriggerCondition } from "../../../engine/skill"

// One charge is 900 units, a unit per frame of its 15 s recharge, so a recharge
// advances in whole units and a cast is allowed exactly where the game allows it.
export const UNITS_PER_CHARGE = 900

// In-game values as of 2026-10-15: two charges, 15 s each.
export const reveldriftChargesMeter = defineMeter({
  id: "reveldriftCharges",
  name: "Reveldrift charges",
  capacity: 2 * UNITS_PER_CHARGE,
  start: "full",
  regenPerSecond: UNITS_PER_CHARGE / 15,
  displayUnitSize: UNITS_PER_CHARGE,
})

export const reveldriftChargeCost: MeterCost = {
  meterId: reveldriftChargesMeter.id,
  amount: UNITS_PER_CHARGE,
}

export const reveldriftChargeAvailable: TriggerCondition = {
  buffId: meterStatusId(reveldriftChargesMeter.id),
  op: "gte",
  stacks: UNITS_PER_CHARGE,
}
