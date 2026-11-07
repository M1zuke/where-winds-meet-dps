import { hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"
import {
  BLEED_MECHANISM_ENHANCEMENT_GAIN,
  BLEED_MECHANISM_ENHANCEMENT_RELEASE,
} from "./buffs/bleedMechanismEnhancement"

// In-game hit frames as of 2026-10-16.
export const SWORDSPECIAL_HITS: SkillHit[] = [
  hit(0, {
    frame: 28.8,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
      BLEED_MECHANISM_ENHANCEMENT_RELEASE,
    ],
  }),
  hit(1, {
    frame: 35.16,
    physMultiplier: 0.392708,
    attributeMultiplier: 0.589062,
    physFixed: 108.8,
    attributeFixed: 59.2,
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
  hit(2, {
    frame: 43.44,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
  hit(3, {
    frame: 75.96,
    physMultiplier: 0.392708,
    attributeMultiplier: 0.589062,
    physFixed: 108.8,
    attributeFixed: 59.2,
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
]
