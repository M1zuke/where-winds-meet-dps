import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

export const umbdronelaunch20Hit = defineSkill({
  id: SKILL.umbdronelaunch20Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[20hit]",
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
  castTag: CAST.umbDroneLaunch20hit,
  castFrames: 68,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.54,
      attributeMultiplier: 0.81,
      // In-game values as of 2026-09-24.
      physFixed: 149.4,
      attributeFixed: 81.5,
      extraCritDamage: 0,
      triggers: [applyDebuff({ target: DEBUFF.umbdrone20Hit })],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
