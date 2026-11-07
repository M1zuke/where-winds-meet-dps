import { hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { STATUS } from "./ids"

// In-game values as of 2026-10-15: Tipsylay opens the stance on frame 4 and
// Primepick and Grounddrift spend it on release.
export const NIGHTWICK_STANCE_CAST_CONDITIONS: TriggerCondition[] = [
  { buffId: STATUS.nightwickStance, op: "gte", stacks: 1 },
]

export const nightwickStanceOpened = (index: number) =>
  hit(index, {
    frame: 4,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyBuff({ target: STATUS.nightwickStance, stacks: 1 })],
  })

export const nightwickStanceSpent = (index: number) =>
  hit(index, {
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyBuff({ target: STATUS.nightwickStance, stacks: -1 })],
  })
