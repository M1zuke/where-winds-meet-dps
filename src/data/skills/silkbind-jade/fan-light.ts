import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

// In-game values as of 2026-11-10: at maximum distance the stage-1 hit is the
// 80 m/s bullet, launched 17.4 f into the clip that follows the 14.4 f hold
// decision, not the melee collider; the bullet lives 0.2 s.
const STAGE_ONE_BULLET = {
  frame: 31.8,
  projectile: { speedMetersPerSecond: 80, maxTravelFrames: 12 },
}

// In-game values as of 2026-10-06: a tap releases the first stage only.
export const fanLight = defineSkill({
  id: SKILL.fanLight,
  classId: "silkbindJade",
  name: "Fan - Light Attack",
  tags: [WEAPON.fan, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLight,
  receives: [
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    ...INKWELL_FAN_RECEIVES,
  ],
  castFrames: 37,
  triggerable: true,
  hits: [
    hit(0, {
      ...STAGE_ONE_BULLET,
      physMultiplier: 0.408064,
      attributeMultiplier: 0.612096,
      physFixed: 113,
      attributeFixed: 61.6,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
