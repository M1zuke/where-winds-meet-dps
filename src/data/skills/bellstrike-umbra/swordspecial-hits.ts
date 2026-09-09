import { hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"

export const SWORDSPECIAL_HITS: SkillHit[] = [
  hit(0, {
    frame: 29,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
  }),
  hit(1, {
    frame: 35,
    physMultiplier: 0.392708,
    attributeMultiplier: 0.589062,
    physFixed: 108.8,
    attributeFixed: 59.2,
    triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
  }),
  hit(2, {
    frame: 43,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
  }),
  hit(3, {
    frame: 76,
    physMultiplier: 0.392708,
    attributeMultiplier: 0.589062,
    physFixed: 108.8,
    attributeFixed: 59.2,
    triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
  }),
]
