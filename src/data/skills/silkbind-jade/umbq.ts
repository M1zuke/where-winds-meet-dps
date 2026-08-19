import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const umbq = defineSkill({
  id: SKILL.umbq,
  classId: "silkbindJade",
  name: "UmbQ",
  abilityTag: "UmbQ",
  tags: [PROP.isMartialSkillQ, PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTUNE.umbQ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbQ,
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.3389,
      attributeMultiplier: 3.5084,
      physFixed: 541,
      attributeFixed: 303,
      extraCritDamage: 1,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})