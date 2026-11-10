import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

const FIRST_STAGE = {
  physMultiplier: 0.408064,
  attributeMultiplier: 0.612096,
  physFixed: 113,
  attributeFixed: 61.6,
}

// In-game values as of 2026-11-10: at maximum distance the stage-1 hit is the
// 80 m/s bullet, launched 17.4 f into the clip that follows the 14.4 f hold
// decision, not the melee collider; the bullet lives 0.2 s.
const STAGE_ONE_BULLET = {
  frame: 31.8,
  projectile: { speedMetersPerSecond: 80, maxTravelFrames: 12 },
}

// In-game values as of 2026-10-06: the four stages pressed in a row, stages 2
// to 4 hit at their melee frames.
export const fanLightChain = defineSkill({
  id: SKILL.fanLightChain,
  classId: "silkbindJade",
  name: "Fan - Light Attack (4-stage)",
  tags: [WEAPON.fan, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightChain,
  receives: [
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    ...INKWELL_FAN_RECEIVES,
  ],
  castFrames: 150,
  triggerable: true,
  hits: [
    hit(0, { ...STAGE_ONE_BULLET, ...FIRST_STAGE }),
    hit(1, {
      frame: 55,
      physMultiplier: 0.306048,
      attributeMultiplier: 0.459072,
      physFixed: 84.75,
      attributeFixed: 46.2,
    }),
    hit(2, { frame: 75, ...FIRST_STAGE }),
    hit(3, {
      frame: 103,
      physMultiplier: 0.918144,
      attributeMultiplier: 1.377216,
      physFixed: 254.25,
      attributeFixed: 138.6,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
