import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

export const umbdronelaunch26Hit = defineSkill({
  id: SKILL.umbdronelaunch26Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[26hit]",
  breakdownName: "Umbrella Launch",
  tags: [PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTACK.heavy, ROLE.umbDrone, ROLE.umbDroneLaunch],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castTag: CAST.umbDroneLaunch26hit,
  castFrames: 68,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.54,
      attributeMultiplier: 0.81,
      // In-game values as of 2026-09-24.
      physFixed: 149.4,
      attributeFixed: 81.5,
      extraCritDamage: 0,
      triggers: [applyDebuff({ target: DEBUFF.umbdrone26Hit })],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
