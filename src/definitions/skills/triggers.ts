import type { HitTrigger, TriggerCondition, TriggerKind } from "../../engine/skill"
import type { QiPhase } from "../../engine/effects/context"

interface TriggerSpec {
  target: string
  stacks?: number
  condition?: TriggerCondition | null
  conditions?: TriggerCondition[]
  extendFrames?: number
  extendOnly?: boolean
  maxExtendedDurationFrames?: number
  transferFrom?: string
  phase?: QiPhase
  cooldownFrames?: number
  durationFrames?: number
}

function trigger(kind: TriggerKind, spec: TriggerSpec): HitTrigger {
  return {
    kind,
    targetId: spec.target,
    stacks: spec.stacks ?? 1,
    condition: spec.condition ?? null,
    ...(spec.conditions ? { conditions: spec.conditions } : {}),
    ...(spec.transferFrom !== undefined ? { transferFrom: spec.transferFrom } : {}),
    ...(spec.phase !== undefined ? { phase: spec.phase } : {}),
    ...(spec.cooldownFrames !== undefined ? { cooldownFrames: spec.cooldownFrames } : {}),
    ...(spec.durationFrames !== undefined ? { durationFrames: spec.durationFrames } : {}),
    ...(spec.extendFrames !== undefined ? { extendFrames: spec.extendFrames } : {}),
    ...(spec.extendOnly !== undefined ? { extendOnly: spec.extendOnly } : {}),
    ...(spec.maxExtendedDurationFrames !== undefined
      ? { maxExtendedDurationFrames: spec.maxExtendedDurationFrames }
      : {}),
  }
}

export const applyDot = (spec: TriggerSpec): HitTrigger => trigger("applyDot", spec)
export const applyDebuff = (spec: TriggerSpec): HitTrigger => trigger("applyDebuff", spec)
export const applyBuff = (spec: TriggerSpec): HitTrigger => trigger("applyBuff", spec)
export const castSkill = (spec: TriggerSpec): HitTrigger => trigger("castSkill", spec)
export const detonateDot = (spec: TriggerSpec): HitTrigger => trigger("detonateDot", spec)
export const releaseEcho = (spec: TriggerSpec): HitTrigger => trigger("releaseEcho", spec)
