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
  appliesOnCastEnd?: boolean
  transferFrom?: string
  phase?: QiPhase
  cooldownFrames?: number
  cooldownFloorFrames?: number
  cooldownGroup?: string
  durationFrames?: number
  requiresParam?: string
  requiresMinTier?: number
  meterSpendCapToCurrent?: number
  recordSpendAsStatus?: string
  refundFractionOfCastCost?: number
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
    ...(spec.cooldownFloorFrames !== undefined
      ? { cooldownFloorFrames: spec.cooldownFloorFrames }
      : {}),
    ...(spec.cooldownGroup !== undefined ? { cooldownGroup: spec.cooldownGroup } : {}),
    ...(spec.durationFrames !== undefined ? { durationFrames: spec.durationFrames } : {}),
    ...(spec.extendFrames !== undefined ? { extendFrames: spec.extendFrames } : {}),
    ...(spec.extendOnly !== undefined ? { extendOnly: spec.extendOnly } : {}),
    ...(spec.maxExtendedDurationFrames !== undefined
      ? { maxExtendedDurationFrames: spec.maxExtendedDurationFrames }
      : {}),
    ...(spec.appliesOnCastEnd !== undefined ? { appliesOnCastEnd: spec.appliesOnCastEnd } : {}),
    ...(spec.requiresParam !== undefined ? { requiresParam: spec.requiresParam } : {}),
    ...(spec.requiresMinTier !== undefined ? { requiresMinTier: spec.requiresMinTier } : {}),
    ...(spec.meterSpendCapToCurrent !== undefined
      ? { meterSpendCapToCurrent: spec.meterSpendCapToCurrent }
      : {}),
    ...(spec.recordSpendAsStatus !== undefined
      ? { recordSpendAsStatus: spec.recordSpendAsStatus }
      : {}),
    ...(spec.refundFractionOfCastCost !== undefined
      ? { refundFractionOfCastCost: spec.refundFractionOfCastCost }
      : {}),
  }
}

export const applyDot = (spec: TriggerSpec): HitTrigger => trigger("applyDot", spec)
export const applyDebuff = (spec: TriggerSpec): HitTrigger => trigger("applyDebuff", spec)
export const applyBuff = (spec: TriggerSpec): HitTrigger => trigger("applyBuff", spec)
export const castSkill = (spec: TriggerSpec): HitTrigger => trigger("castSkill", spec)
export const detonateDot = (spec: TriggerSpec): HitTrigger => trigger("detonateDot", spec)
export const releaseEcho = (spec: TriggerSpec): HitTrigger => trigger("releaseEcho", spec)
export const clearStatus = (spec: TriggerSpec): HitTrigger => trigger("clearStatus", spec)
export const meterDelta = (spec: TriggerSpec): HitTrigger => trigger("meterDelta", spec)
export const cooldownCut = (spec: TriggerSpec): HitTrigger => trigger("cooldownCut", spec)
