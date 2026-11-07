import { hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { STATUS } from "./ids"

// In-game values as of 2026-10-15: Realmplay grants the buff for 1.1 s and
// Blade Against Waves and Tidepour spend it on release.
export const EMPOWERED_LIGHT_ATTACK_CAST_CONDITIONS: TriggerCondition[] = [
  { buffId: STATUS.bingePoints, op: "gt", stacks: 49 },
  { buffId: STATUS.empoweredLightAttack, op: "gte", stacks: 1 },
]

export const empoweredLightAttackSpent = (index: number) =>
  hit(index, {
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyBuff({ target: STATUS.empoweredLightAttack, stacks: -1 })],
  })

export const LIGHT_ATTACK_NOT_REPLACED: TriggerCondition = {
  anyOf: [
    { buffId: STATUS.empoweredLightAttack, op: "eq", stacks: 0 },
    { buffId: STATUS.bingePoints, op: "lte", stacks: 49 },
  ],
}

export const BLADE_VESSEL_NOT_REPLACED: TriggerCondition[] = [
  {
    anyOf: [
      { buffId: STATUS.bingePoints, op: "lt", stacks: 100 },
      { buffId: STATUS.empoweredLightAttack, op: "gte", stacks: 1 },
    ],
  },
  LIGHT_ATTACK_NOT_REPLACED,
]
