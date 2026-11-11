import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"
import { SKILL, DEBUFF } from "./ids"
import {
  SLOW_FORM_BONUS_FRAME,
  SLOW_FORM_FIRST_HIT_FRAME,
  SLOW_FORM_FULL_CAST_FRAMES,
  SLOW_FORM_SECOND_HIT_FRAME,
  slowFormOpensIntoxicated,
  slowFormVariant,
} from "../dragonBreathSlowForm"

const ROW = {
  physMultiplier: 1.360884,
  attributeMultiplier: 2.041327,
  physFixed: 215.2962,
  attributeFixed: 0,
}

const BONUS_ROW = {
  physMultiplier: 1.49975,
  attributeMultiplier: 2.249625,
  physFixed: 237.2652,
  attributeFixed: 0,
}

export const fireBreath2Hit = defineSkill({
  id: SKILL.fireBreath2Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath 2 Hits",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath2Hits,
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-09-24.
  castFrames: 137,
  triggerable: true,
  receives: WINEBOUND_MYSTIC_RECEIVES,
  // In-game values as of 2026-10-18.
  vitalityCost: 20,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  // In-game values as of 2026-10-15.
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 1.360884,
      attributeMultiplier: 2.041327,
      physFixed: 215.2962,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.combustion, extendFrames: 90 })],
      variants: [
        slowFormVariant(
          SKILL.fireBreath2Hit,
          0,
          ROW,
          SLOW_FORM_FIRST_HIT_FRAME,
          SLOW_FORM_FULL_CAST_FRAMES,
        ),
      ],
    }),
    hit(1, {
      frame: 102,
      physMultiplier: 1.360884,
      attributeMultiplier: 2.041327,
      physFixed: 215.2962,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          target: DEBUFF.combustion,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
      variants: [slowFormVariant(SKILL.fireBreath2Hit, 1, ROW, SLOW_FORM_SECOND_HIT_FRAME)],
    }),
    hit(2, {
      frame: 108,
      ...BONUS_ROW,
      triggers: [
        applyDebuff({
          target: DEBUFF.combustion,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
      variants: [slowFormVariant(SKILL.fireBreath2Hit, 2, BONUS_ROW, SLOW_FORM_BONUS_FRAME)],
    }),
    slowFormOpensIntoxicated(3),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
