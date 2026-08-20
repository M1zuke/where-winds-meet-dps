import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const fanqcancel = defineSkill({
  id: SKILL.fanqcancel,
  classId: "silkbindJade",
  name: "FanQCancel",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQCancel,
  triggersBuffs: [BUFF.jadeware, BUFF.windWall, BUFF.windWallPursuit, BUFF.springThunder],
  castFrames: 6,
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
