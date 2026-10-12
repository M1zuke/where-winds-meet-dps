import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UNFETTERED_ROPE_DART_RECEIVES } from "./receives"

export const ROPE_LIGHT_FIRST_STAGE_HIT = {
  physMultiplier: 0.59152,
  attributeMultiplier: 0.88728,
  physFixed: 165,
  attributeFixed: 90,
}

const SECOND_STAGE_HIT = {
  physMultiplier: 0.35081,
  attributeMultiplier: 0.526215,
  physFixed: 97.5,
  attributeFixed: 53,
}

const THIRD_STAGE_HIT = {
  physMultiplier: 0.358585,
  attributeMultiplier: 0.5378775,
  physFixed: 99.5,
  attributeFixed: 54,
}

const FOURTH_STAGE_SHORT_HIT = {
  physMultiplier: 0.279069,
  attributeMultiplier: 0.4186035,
  physFixed: 77.4,
  attributeFixed: 42.3,
}

const FOURTH_STAGE_LONG_HIT = {
  physMultiplier: 0.651161,
  attributeMultiplier: 0.9767415,
  physFixed: 180.6,
  attributeFixed: 98.7,
}

// In-game values as of 2026-10-12: the stages pressed at each stage's earliest
// next input.
export const ropeLightAttack = defineSkill({
  id: SKILL.ropeLightAttack,
  classId: "bamboocutDust",
  name: "Rope Dart - Light Attack (4-stage)",
  breakdownName: "Rope Dart - Light Attack",
  tags: [WEAPON.ropeDart, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustRopeLightAttack,
  receives: UNFETTERED_ROPE_DART_RECEIVES,
  castFrames: 209,
  triggerable: false,
  hits: [
    hit(0, { frame: 30, ...ROPE_LIGHT_FIRST_STAGE_HIT }),
    hit(1, { frame: 62, ...SECOND_STAGE_HIT }),
    hit(2, { frame: 85, ...SECOND_STAGE_HIT }),
    hit(3, { frame: 112, ...THIRD_STAGE_HIT }),
    hit(4, { frame: 120, ...THIRD_STAGE_HIT }),
    hit(5, { frame: 128, ...THIRD_STAGE_HIT }),
    hit(6, { frame: 167, ...FOURTH_STAGE_SHORT_HIT }),
    hit(7, { frame: 189, ...FOURTH_STAGE_LONG_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
