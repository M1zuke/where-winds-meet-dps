import {
  defineMeter,
  meterStatusId,
  type MeterMaxContext,
} from "../../../definitions/resources/meterDef"
import type { MeterCost, TriggerCondition } from "../../../engine/skill"
import { PARAM } from "../../skills/buffs/ids"

// One charge is 900 units, a unit per frame of its 15 s recharge, so a recharge
// advances in whole units and a cast is allowed exactly where the game allows it.
export const UNITS_PER_CHARGE = 900
export const UNITS_PER_SECOND_OF_RECHARGE = UNITS_PER_CHARGE / 15
const UNITS_PER_SECOND_OF_TWELVE_SECOND_RECHARGE = UNITS_PER_CHARGE / 12

// In-game values as of 2026-10-15: two charges, 15 s each.
export const emeraldBarrierChargesMeter = defineMeter({
  id: "emeraldBarrierCharges",
  name: "Emerald Barrier charges",
  capacity: 2 * UNITS_PER_CHARGE,
  start: "full",
  regenPerSecond: UNITS_PER_SECOND_OF_RECHARGE,
  displayUnitSize: UNITS_PER_CHARGE,
})

function springSorrowCharges(ctx: MeterMaxContext): number {
  if (!ctx.paramOn(PARAM.blossomBarrage)) return 1
  return ctx.paramTier(PARAM.blossomBarrage) >= 6 ? 3 : 2
}

// In-game values as of 2026-10-15: 15 s per charge, one charge, two from Blossom
// Barrage and three from its rank 6. Rank 6 also cuts 5 s off the recharge on
// every Spring Sorrow hit that finds your Combo on the target, so the meter
// settles after the buff engine has said which Combos are up.
export const springSorrowChargesMeter = defineMeter({
  id: "springSorrowCharges",
  name: "Spring Sorrow charges",
  capacity: (ctx: MeterMaxContext) => springSorrowCharges(ctx) * UNITS_PER_CHARGE,
  start: "full",
  regenPerSecond: UNITS_PER_SECOND_OF_RECHARGE,
  displayUnitSize: UNITS_PER_CHARGE,
  dependsOnBuffs: true,
})

// In-game values as of 2026-10-15: one charge recharging in 12 s; Gourd Toss
// makes it two charges of 15 s each (its recharge modifier slows the rate).
export const peaksSpringlessSilenceChargesMeter = defineMeter({
  id: "peaksSpringlessSilenceCharges",
  name: "Peak's Springless Silence charges",
  capacity: (ctx: MeterMaxContext) => (ctx.paramOn(PARAM.gourdToss) ? 2 : 1) * UNITS_PER_CHARGE,
  start: "full",
  regenPerSecond: UNITS_PER_SECOND_OF_TWELVE_SECOND_RECHARGE,
  displayUnitSize: UNITS_PER_CHARGE,
})

export const SILKBIND_JADE_CHARGE_METERS = [
  emeraldBarrierChargesMeter,
  springSorrowChargesMeter,
  peaksSpringlessSilenceChargesMeter,
] as const

export const chargeCost = (meter: { id: string }): MeterCost => ({
  meterId: meter.id,
  amount: UNITS_PER_CHARGE,
})

export const chargeAvailable = (meter: { id: string }): TriggerCondition => ({
  buffId: meterStatusId(meter.id),
  op: "gte",
  stacks: UNITS_PER_CHARGE,
})
