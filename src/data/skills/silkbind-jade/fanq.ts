import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const fanq = defineSkill({
  id: SKILL.fanq,
  classId: "silkbindJade",
  name: "FanQ",
  abilityTag: "FanQ",
  tags: [PROP.isMartialSkillQ, WEAPON.fan, ATTUNE.fanQ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanQ,
  castFrames: 66,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.9266,
      attributeMultiplier: 1.3899,
      physFixed: 215,
      attributeFixed: 120,
      extraCritDamage: 0,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
