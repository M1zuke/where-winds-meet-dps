import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"

export const toadCancel = defineSkill({
  id: SKILL.toadCancel,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Toad[Cancel]",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadCancel,
  cancelledBy: "deflectCancel",
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-09-24.
  castFrames: 96,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 25,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 40,
      ...levelScaled(LEVEL_ROWS.toadStrike),
    }),
    hit(1, {
      frame: 68,
      ...levelScaled(LEVEL_ROWS.toadFinisher),
      triggers: [applyDebuff({ target: DEBUFF.toadPoison })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
