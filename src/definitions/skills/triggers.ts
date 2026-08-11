import type { HitTrigger, TriggerCondition, TriggerKind } from "../../engine/skill"

// Trigger ids are NOT positional (`tg-swordq-bleed`, `tg-spearspecial-bleed-1-h0`,
// …) and stay explicit — these helpers fill `condition: null` and `stacks`
// defaults only, they never invent an id.
interface TriggerSpec {
  id: string
  target: string
  stacks?: number
  condition?: TriggerCondition | null
  conditions?: TriggerCondition[]
  extendFrames?: number
  extendOnly?: boolean
  maxExtendedDurationFrames?: number
}

function trigger(kind: TriggerKind, spec: TriggerSpec): HitTrigger {
  return {
    id: spec.id,
    kind,
    targetId: spec.target,
    stacks: spec.stacks ?? 1,
    condition: spec.condition ?? null,
    ...(spec.conditions ? { conditions: spec.conditions } : {}),
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
