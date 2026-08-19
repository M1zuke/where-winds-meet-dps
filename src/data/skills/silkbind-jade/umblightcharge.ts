import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const umbLightCharge = defineSkill({
  id: SKILL.umbLightCharge,
  classId: "silkbindJade",
  name: "UmbLightCharge",
  abilityTag: "UmbLightCharge",
  tags: [PROP.isCharged, PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTUNE.umbCharged],
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightCharge,
  castFrames: 147,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
    hit(1, { frame: 10, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
    hit(2, { frame: 20, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
    hit(3, { frame: 30, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
    hit(4, { frame: 40, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
    hit(5, { frame: 50, physMultiplier: 1.7173, attributeMultiplier: 2.576, physFixed: 396, attributeFixed: 221, extraCritDamage: 1, triggers: [] }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})