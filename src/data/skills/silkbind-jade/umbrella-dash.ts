import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

const COLLIDER_HIT = {
  physMultiplier: 0.439065,
  attributeMultiplier: 0.658598,
  physFixed: 122,
  attributeFixed: 66.5,
}

const BULLET_HIT = {
  physMultiplier: 0.304656,
  attributeMultiplier: 0.456984,
  physFixed: 84.4,
  attributeFixed: 46.0,
  extraCritDamage: 1,
}

// In-game values as of 2026-10-06: two collider hits, then a bullet launched
// with the second at 30 m/s.
export const umbrellaDash = defineSkill({
  id: SKILL.umbrellaDash,
  classId: "silkbindJade",
  name: "Umbrella - Dash",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaDash,
  receives: [BUFF.windWall, BUFF.trajectorySkill, BUFF.combo, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 88,
  triggerable: true,
  hits: [
    hit(0, { frame: 17, ...COLLIDER_HIT }),
    hit(1, { frame: 51, ...COLLIDER_HIT }),
    hit(2, {
      frame: 51,
      ...BULLET_HIT,
      projectile: { speedMetersPerSecond: 30, maxTravelFrames: 120 },
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
