import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const fanLightCharged = defineSkill({
  id: SKILL.fanLightCharged,
  classId: "silkbindJade",
  name: "FanLightCharged",
  abilityTag: "FanLightCharged",
  tags: [PROP.isCharged, WEAPON.fan, ATTUNE.fanCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightCharged,
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.9039,
      attributeMultiplier: 2.8558,
      physFixed: 440,
      attributeFixed: 246,
      extraCritDamage: 1,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
