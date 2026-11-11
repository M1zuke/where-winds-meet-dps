import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

const THIRD_OF_ROW = {
  ...levelScaled(LEVEL_ROWS.fanDashHit0),
}

// In-game values as of 2026-10-06: the second collider hits twice, once in
// each of the dash's two clips.
export const fanDash = defineSkill({
  id: SKILL.fanDash,
  classId: "silkbindJade",
  name: "Fan - Dash",
  tags: [WEAPON.fan],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanDash,
  receives: INKWELL_FAN_RECEIVES,
  castFrames: 63,
  triggerable: true,
  hits: [
    hit(0, { frame: 13, ...THIRD_OF_ROW }),
    hit(1, { frame: 33, ...THIRD_OF_ROW }),
    hit(2, { frame: 39, ...THIRD_OF_ROW }),
    hit(3, {
      frame: 60,
      ...levelScaled(LEVEL_ROWS.fanDashHit3),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
