import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const healerBuff = defineSkill({
  id: SKILL.healerBuff,
  classId: "silkbindJade",
  name: "Healer Buff",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Silkbind",
  castTag: CAST.healerBuff,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
