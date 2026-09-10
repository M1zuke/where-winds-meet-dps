import { hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"

export const CROSSWIND_BLADE_HITS: SkillHit[] = [
  hit(0, {
    frame: 6,
    physMultiplier: 0.625421,
    attributeMultiplier: 0.938132,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
  }),
]
