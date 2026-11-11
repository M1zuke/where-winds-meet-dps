import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { BRANCH_FORM_MIN_BREAKTHROUGH } from "./branchFormFloor"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"

export const toadFury = defineSkill({
  id: SKILL.toadFury,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Leaping Toad - Fury",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadFury,
  minBreakthrough: BRANCH_FORM_MIN_BREAKTHROUGH,
  cancelledBy: "deflectCancel",
  castFrames: 96,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 25,
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 40,
      ...levelScaled(LEVEL_ROWS.toadFuryStrike),
    }),
    hit(1, {
      frame: 68,
      ...levelScaled(LEVEL_ROWS.toadFuryFinisher),
      triggers: [applyDebuff({ target: DEBUFF.toadPoisonFury })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
