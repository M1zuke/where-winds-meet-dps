import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

export const umbdronelaunch12Hit = defineSkill({
  id: SKILL.umbdronelaunch12Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[12hit]",
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
  castTag: CAST.umbDroneLaunch12hit,
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 66,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      // In-game values as of 2026-09-24: the throw's collider frame.
      frame: 36,
      physMultiplier: 0.539718,
      attributeMultiplier: 0.809577,
      // In-game values as of 2026-10-05.
      physFixed: 149.4,
      attributeFixed: 81.4,
      extraCritDamage: 0,
      triggers: [applyDebuff({ target: DEBUFF.umbdrone12Hit })],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
