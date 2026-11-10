import type {
  CoefficientRow,
  HitVariant,
  LevelRows,
  SkillHit,
  TriggerCondition,
} from "../../engine/skill"
import { hit } from "../../definitions/skills/skillDef"
import { applyDebuff } from "../../definitions/skills/triggers"
import { DEBUFF } from "./mystic/ids"
import { SKILL as UNIVERSAL_SKILL } from "./universal/ids"
import { SKILL as SPLENDOR_SKILL } from "./bellstrike-splendor/ids"

// In-game values as of 2026-11-10. Without Intoxicated at the press, Dragon's
// Breath plays its slow animation for the whole cast: hits at 76.38 and 163.66
// frames, the bonus 6 frames after the second, the cast ending at 164.66. The
// slow animation opens Intoxicated 12 frames in. A following skill of higher
// priority than the breath breaks it from the first frame; any other breaks it
// only from the animation's own end, 150 frames in (slow) or 136.8 (quick).
export const SLOW_FORM_OPENS_INTOXICATED_FRAME = 12
export const SLOW_FORM_FIRST_HIT_FRAME = 76.38
export const SLOW_FORM_SECOND_HIT_FRAME = 163.66
export const SLOW_FORM_BONUS_FRAME = 169.66
export const SLOW_FORM_FULL_CAST_FRAMES = 164.66
export const SLOW_FORM_BREAK_FRAME = 150
export const SLOW_FORM_HIGHER_PRIORITY_BREAK_FRAME = 77.38
export const QUICK_FORM_BREAK_FRAME = 136.8
export const QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME = 37.39

export const HIGHER_PRIORITY_NEXT_STEPS = [
  UNIVERSAL_SKILL.deflectCancel,
  SPLENDOR_SKILL.energySurge,
]

export const NOT_INTOXICATED: TriggerCondition = {
  buffId: DEBUFF.intoxicated,
  op: "lt",
  stacks: 1,
}
export const INTOXICATED: TriggerCondition = { buffId: DEBUFF.intoxicated, op: "gte", stacks: 1 }

const NO_DAMAGE: CoefficientRow = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}

export function slowFormVariant(
  skillId: string,
  hitIndex: number,
  row: CoefficientRow & { levelRows?: LevelRows },
  frame: number,
  castFrames?: number,
): HitVariant {
  return {
    id: `hv-${skillId}-hit-${hitIndex}-slow-form`,
    label: "Not Intoxicated",
    conditions: [NOT_INTOXICATED],
    physMultiplier: row.physMultiplier,
    attributeMultiplier: row.attributeMultiplier,
    physFixed: row.physFixed,
    attributeFixed: row.attributeFixed,
    ...(row.levelRows ? { levelRows: row.levelRows } : {}),
    frame,
    ...(castFrames === undefined ? {} : { castFrames }),
  }
}

const opensIntoxicated = applyDebuff({ target: DEBUFF.intoxicated })

export function slowFormOpensIntoxicated(index: number): SkillHit {
  return hit(index, {
    frame: SLOW_FORM_OPENS_INTOXICATED_FRAME,
    ...NO_DAMAGE,
    conditions: [NOT_INTOXICATED],
    triggers: [opensIntoxicated],
  })
}

export function slowFormBreakMarkers(firstIndex: number): SkillHit[] {
  return [
    hit(firstIndex, {
      frame: SLOW_FORM_OPENS_INTOXICATED_FRAME,
      ...NO_DAMAGE,
      conditions: [NOT_INTOXICATED],
      unlessNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
      castFramesWhenGated: SLOW_FORM_BREAK_FRAME,
      triggers: [opensIntoxicated],
    }),
    hit(firstIndex + 1, {
      frame: SLOW_FORM_OPENS_INTOXICATED_FRAME,
      ...NO_DAMAGE,
      conditions: [NOT_INTOXICATED],
      requiresNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
      castFramesWhenGated: SLOW_FORM_HIGHER_PRIORITY_BREAK_FRAME,
      triggers: [opensIntoxicated],
    }),
  ]
}

export function quickFormFollowUpHit(
  index: number,
  frame: number,
  row: CoefficientRow & { levelRows?: LevelRows },
  triggers: SkillHit["triggers"],
): SkillHit {
  return hit(index, {
    frame,
    ...row,
    conditions: [INTOXICATED],
    unlessNextStepSkillIds: HIGHER_PRIORITY_NEXT_STEPS,
    castFramesWhenGated: QUICK_FORM_BREAK_FRAME,
    triggers,
  })
}
