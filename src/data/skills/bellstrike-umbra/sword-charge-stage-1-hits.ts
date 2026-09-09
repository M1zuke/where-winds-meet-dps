import { hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"

export const SWORD_CHARGE_STAGE_1_HITS: SkillHit[] = [
  hit(0, {
    frame: 6,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 30,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 40,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 50,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 108,
    physMultiplier: 0.67154,
    attributeMultiplier: 1.00731,
    physFixed: 186,
    attributeFixed: 101.25,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]
