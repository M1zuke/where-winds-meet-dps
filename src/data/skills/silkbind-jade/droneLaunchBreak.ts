import { hit } from "../../../definitions/skills/skillDef"
import type { SkillHit } from "../../../engine/skill"
import { SKILL as UNIVERSAL_SKILL } from "../universal/ids"
import { SKILL } from "./ids"

// In-game values as of 2026-11-10: the throw outranks only skills of priority 2
// or lower, which wait for its recovery at 65.58 frames. A follower of higher
// priority breaks it from the frame the umbrella attaches, 36.
export const LAUNCH_HIGHER_PRIORITY_FOLLOW_UPS = [
  SKILL.fanspecial,
  SKILL.fanspecialReturn,
  SKILL.fanq,
  SKILL.fanqcancel,
  SKILL.fanheavypursuit3Hit,
  SKILL.fanheavypursuit5Hit,
  SKILL.bambooBreeze,
  UNIVERSAL_SKILL.deflectCancel,
]
export const LAUNCH_HIGHER_PRIORITY_BREAK_FRAME = 36

export const launchHigherPriorityBreak = (index: number): SkillHit =>
  hit(index, {
    frame: LAUNCH_HIGHER_PRIORITY_BREAK_FRAME,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    requiresNextStepSkillIds: LAUNCH_HIGHER_PRIORITY_FOLLOW_UPS,
    castFramesWhenGated: LAUNCH_HIGHER_PRIORITY_BREAK_FRAME,
  })
