import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

const COLLIDER_HIT = {
  physMultiplier: 0.439065,
  attributeMultiplier: 0.658598,
  physFixed: 122,
  attributeFixed: 66.5,
}

// In-game values as of 2026-11-10: the two collider hits carry no
// trajectory tag, so no umbrella talent, Jadebreak or Combo reaches them;
// the bullet launched with the second one is its own skill.
export const umbrellaDash = defineSkill({
  id: SKILL.umbrellaDash,
  classId: "silkbindJade",
  name: "Umbrella - Dash",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaDash,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 88,
  triggerable: true,
  hits: [
    hit(0, { frame: 17, ...COLLIDER_HIT }),
    hit(1, {
      frame: 51,
      ...COLLIDER_HIT,
      triggers: [castSkill({ target: SKILL.umbrellaDashBullet })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
