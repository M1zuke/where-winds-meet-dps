import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const umbHeavyLight = defineSkill({
  id: SKILL.umbHeavyLight,
  classId: "silkbindJade",
  name: "Umb HeavyLight",
  abilityTag: "Umb HeavyLight",
  tags: [WEAPON.umbrella, ATTACK.mixed],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbHeavyLight,
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, physMultiplier: 0.4350446666666666, attributeMultiplier: 0.652556, physFixed: 100.51333333333334, attributeFixed: 56, extraCritDamage: 0, triggers: [] }),
    hit(1, { frame: 25, physMultiplier: 0.4350446666666666, attributeMultiplier: 0.652556, physFixed: 100.51333333333334, attributeFixed: 56, extraCritDamage: 0, triggers: [] }),
    hit(2, { frame: 50, physMultiplier: 0.4350446666666666, attributeMultiplier: 0.652556, physFixed: 100.51333333333334, attributeFixed: 56, extraCritDamage: 0, triggers: [] }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})