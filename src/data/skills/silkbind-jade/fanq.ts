import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const fanq = defineSkill({
  id: SKILL.fanq,
  classId: "silkbindJade",
  name: "FanQ",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQ,
  triggersBuffs: [BUFF.jadeware, BUFF.windWall, BUFF.windWallPursuit, BUFF.springThunder],
  castFrames: 66,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.9271,
      attributeMultiplier: 1.3907,
      physFixed: 257,
      attributeFixed: 140,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
