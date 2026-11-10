import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL } from "./ids"

// Cast length to the earliest next input and hit frames: in-game animation,
// 2026-09-24.
export const soaring = defineSkill({
  id: SKILL.soaring,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Soaring",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.soaring,
  castFrames: 122,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 15,
  // In-game values as of 2026-09-28: a stationary cast, 15 m engagement
  // range — confirmed no scripted displacement despite the visible dash-in.
  reachMeters: 15,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 48,
      ...levelScaled(LEVEL_ROWS.soaringFirst),
    }),
    hit(1, {
      frame: 122,
      ...levelScaled(LEVEL_ROWS.soaringSecond),
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
