import type { TriggerCondition } from "../../../../engine/skill"
import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF } from "../../buffs/ids"

export const WUSHUANG_STANCE_ACTIVE: TriggerCondition = {
  buffId: BUFF.wushuangStance,
  op: "gte",
  stacks: 1,
}

export const WUSHUANG_STANCE_ABSENT: TriggerCondition = {
  buffId: BUFF.wushuangStance,
  op: "lt",
  stacks: 1,
}

export const wushuangStanceConsume = applyBuff({ target: BUFF.wushuangStance, stacks: -1 })
