import { defineMeter, meterStatusId } from "../../../definitions/resources/meterDef"
import type { MeterCost, TriggerCondition, TriggerOp } from "../../../engine/skill"

// In-game values as of 2026-10-12: capacity 100, 10 / s in and out of combat.
export const fadingCrimsonMeter = defineMeter({
  id: "fadingCrimson",
  name: "Fading Crimson",
  capacity: 100,
  start: "full",
  regenPerSecond: 10,
})

// In-game values as of 2026-10-12: capacity 100, 5 / s in and out of combat.
export const tokensOfGratitudeMeter = defineMeter({
  id: "tokensOfGratitude",
  name: "Tokens of Gratitude",
  capacity: 100,
  start: "full",
  regenPerSecond: 5,
})

export function fadingCrimsonRequires(op: TriggerOp, stacks: number): TriggerCondition {
  return { buffId: meterStatusId(fadingCrimsonMeter.id), op, stacks }
}

export function tokensOfGratitudeRequires(op: TriggerOp, stacks: number): TriggerCondition {
  return { buffId: meterStatusId(tokensOfGratitudeMeter.id), op, stacks }
}

export function fadingCrimsonCost(amount: number): MeterCost {
  return { meterId: fadingCrimsonMeter.id, amount }
}

export function tokensOfGratitudeCost(amount: number): MeterCost {
  return { meterId: tokensOfGratitudeMeter.id, amount }
}
