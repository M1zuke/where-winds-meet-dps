import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

export const fanlightcharged = defineSkill({
  id: SKILL.fanlightcharged,
  classId: "silkbindJade",
  name: "FanLightCharged",
  tags: [PROP.isCharged, WEAPON.fan, ATTACK.light, ATTUNE.fanCharged, ROLE.fanLightCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightCharged,
  receives: [
    BUFF.windWall,
    BUFF.pursuitChargedBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.nonPlayerBaseDamage145,
    ...INKWELL_FAN_RECEIVES,
  ],
  triggersBuffs: [BUFF.lingeringBone],
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      // In-game values as of 2026-09-24.
      physMultiplier: 1.9044,
      attributeMultiplier: 2.8566,
      physFixed: 527,
      attributeFixed: 287,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
