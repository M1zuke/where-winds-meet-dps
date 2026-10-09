import { hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"

// Press-relative frames: the 85 f minimum hold to reach stage 2 plus each
// collider's own frame after release; in-game values as of 2026-10-06.
export const SWORD_CHARGE_STAGE_2_HITS: SkillHit[] = [
  hit(0, {
    frame: 91,
    physMultiplier: 0.67154,
    attributeMultiplier: 1.00731,
    physFixed: 186,
    attributeFixed: 101.25,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 115,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 125,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 135,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 193,
    physMultiplier: 0.805848,
    attributeMultiplier: 1.208772,
    physFixed: 223.2,
    attributeFixed: 121.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]
