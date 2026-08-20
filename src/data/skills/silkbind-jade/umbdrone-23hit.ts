import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { DRONE_TICK } from "./droneTick"

export const umbdrone23HitTick = defineSkill({
  id: SKILL.umbdrone23Hit,
  classId: "silkbindJade",
  name: "UmbDrone[23hit] Tick",
  breakdownName: "Umbrella Drone",
  tags: [PROP.isDrone, WEAPON.umbrella, ATTACK.light, ATTUNE.umbFrequentProjectile, ROLE.umbDrone],
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbDroneTick23hit,
  receives: [
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.soulShaken,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.combo,
    BUFF.windWall,
    BUFF.trajectorySkill,
  ],
  elevatedAttributeMultiplier: false,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...DRONE_TICK })],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
