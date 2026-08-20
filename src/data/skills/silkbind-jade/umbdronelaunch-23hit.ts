import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"

export const umbdronelaunch23Hit = defineSkill({
  id: SKILL.umbdronelaunch23Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[23hit]",
  breakdownName: "Umbrella Launch",
  tags: [
    PROP.hasQiBreakPhysPen,
    WEAPON.umbrella,
    ATTACK.heavy,
    ATTUNE.umbFrequentProjectile,
    ROLE.umbDrone,
    ROLE.umbDroneLaunch,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
  ],
  castTag: CAST.umbDroneLaunch23hit,
  castFrames: 68,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.54,
      attributeMultiplier: 0.81,
      physFixed: 148,
      attributeFixed: 81.5,
      extraCritDamage: 1,
      triggers: [applyDebuff({ target: DEBUFF.umbdrone23Hit })],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
