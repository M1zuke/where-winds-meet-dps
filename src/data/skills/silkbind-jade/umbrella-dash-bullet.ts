import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06: launched with the dash's second collider
// hit at 30 m/s; unlike the collider hits it is a trajectory hit.
export const umbrellaDashBullet = defineSkill({
  id: SKILL.umbrellaDashBullet,
  classId: "silkbindJade",
  name: "Umbrella - Dash (Bullet)",
  breakdownName: "Umbrella - Dash",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaDashBullet,
  receives: [
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.combo,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      ...levelScaled(LEVEL_ROWS.umblightchargeLiftHit0),
      extraCritDamage: 1,
      projectile: { speedMetersPerSecond: 30, maxTravelFrames: 120 },
    }),
  ],
  createdAt: "2026-11-10T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
