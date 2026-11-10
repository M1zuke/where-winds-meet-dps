import { hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"
import {
  BLEED_MECHANISM_ENHANCEMENT_GAIN,
  BLEED_MECHANISM_ENHANCEMENT_RELEASE,
} from "./buffs/bleedMechanismEnhancement"
import { LEVEL_ROWS } from "./levelRows"

// In-game hit frames as of 2026-10-16.
export const SWORDSPECIAL_HITS: SkillHit[] = [
  hit(0, {
    frame: 28.8,
    ...levelScaled(LEVEL_ROWS.swordspecial3HitHit0),
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
      BLEED_MECHANISM_ENHANCEMENT_RELEASE,
    ],
  }),
  hit(1, {
    frame: 35.16,
    ...levelScaled(LEVEL_ROWS.swordspecial3HitHit1),
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
  hit(2, {
    frame: 43.44,
    ...levelScaled(LEVEL_ROWS.swordspecial3HitHit0),
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
  hit(3, {
    frame: 75.96,
    ...levelScaled(LEVEL_ROWS.swordspecial3HitHit1),
    triggers: [
      applyDot({ target: DEBUFF.bleedTick }),
      detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
    ],
  }),
]
