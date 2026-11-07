import { applyBuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger, TriggerCondition } from "../../../../engine/skill"
import { STATUS } from "../ids"

const inCarouse: TriggerCondition = { buffId: STATUS.carouse, op: "gte", stacks: 1 }

// In-game values as of 2026-09-16.
export const skillBingePointAccumulationTriggers: HitTrigger[] = [
  applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25 }),
  applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25, conditions: [inCarouse] }),
]

export const skillBingePointAccumulationTriggersWhen = (
  condition: TriggerCondition,
): HitTrigger[] => [
  applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25, conditions: [condition] }),
  applyBuff({
    target: STATUS.skillBingePointAccumulation,
    stacks: 25,
    conditions: [condition, inCarouse],
  }),
]
