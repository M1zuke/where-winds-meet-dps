import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

const DASH_HIT = {
  physMultiplier: 0.439065,
  attributeMultiplier: 0.6585975,
  physFixed: 122,
  attributeFixed: 66.5,
}

// In-game values as of 2026-10-13: two collider hits, then a projectile
// launched on the second one (`umbrella-dash-bullet.ts`).
export const umbrellaDash = defineSkill({
  id: SKILL.umbrellaDash,
  classId: "bamboocutDust",
  name: "Umbrella - Dash",
  breakdownName: "Umbrella - Dash",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustUmbrellaDash,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 88,
  triggerable: false,
  hits: [
    hit(0, { frame: 17, ...DASH_HIT }),
    hit(1, {
      frame: 51,
      ...DASH_HIT,
      triggers: [castSkill({ target: SKILL.umbrellaDashBullet })],
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
