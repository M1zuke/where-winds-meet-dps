import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

const ROW_SHARE = {
  physMultiplier: 0.31677,
  attributeMultiplier: 0.475155,
  physFixed: 88,
  attributeFixed: 48,
  extraCritDamage: 1,
}

// In-game values as of 2026-11-10: two bullets, launched 20.18 and 26.18 f into
// the cast, each carrying half of the row; at maximum distance the melee hit
// that shares the first bullet's half does not reach. Each bullet starts at
// 20 m/s, gains 90 m/s² up to 50 m/s and lives 2 s.
const BULLET_PROJECTILE = {
  speedMetersPerSecond: 50,
  acceleration: { initialSpeedMetersPerSecond: 20, metersPerSecondSquared: 90 },
  maxTravelFrames: 120,
}

export const umbrellaDual = defineSkill({
  id: SKILL.umbrellaDual,
  classId: "silkbindJade",
  name: "Umbrella (Dual-Weapon Skill)",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaDual,
  receives: [BUFF.windWall, BUFF.trajectorySkill, ...VERNAL_UMBRELLA_RECEIVES],
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 46.36,
  triggerable: true,
  hits: [
    hit(0, { frame: 20.18, projectile: BULLET_PROJECTILE, ...ROW_SHARE }),
    hit(1, { frame: 26.18, projectile: BULLET_PROJECTILE, ...ROW_SHARE }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
