// Placeholder (validated: false). Wiki: Special Skill listed by Blossom
// Barrage as one of the affected Combo-bonus recipients.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const everbloom = defineSkill({
  id: SKILL.everbloom,
  classId: "silkbindJade",
  name: "Everbloom",
  abilityTag: "Everbloom",
  tags: [PROP.isBallistic, WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.everbloom,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
