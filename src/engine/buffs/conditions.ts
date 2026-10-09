import {
  isAnyOfCondition,
  isParamCondition,
  type StatusCondition,
  type TriggerCondition,
} from "../skill"
import { paramOnOf, paramTierOf } from "./params"
import type { BuffParams } from "./buffEngine"

// The one place a `TriggerCondition` is evaluated — every caller supplies
// only `statusHolds`, since a `StatusCondition` is the one branch a ledger
// lookup differs on.
export function unionConditionHolds(
  condition: TriggerCondition,
  frame: number,
  buffParams: BuffParams,
  statusHolds: (condition: StatusCondition, frame: number) => boolean,
): boolean {
  if (isAnyOfCondition(condition))
    return condition.anyOf.some((clause) =>
      unionConditionHolds(clause, frame, buffParams, statusHolds),
    )
  if (isParamCondition(condition)) {
    if (!paramOnOf(buffParams, condition.param)) return false
    return (
      condition.minTier === undefined ||
      paramTierOf(buffParams, condition.param) >= condition.minTier
    )
  }
  return statusHolds(condition, frame)
}
