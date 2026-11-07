import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

const THIRD_OF_ROW = {
  physMultiplier: 0.301464,
  attributeMultiplier: 0.452196,
  physFixed: 83.7,
  attributeFixed: 45.6,
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
      physMultiplier: 0.401952,
      attributeMultiplier: 0.602928,
      physFixed: 111.6,
      attributeFixed: 60.8,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
