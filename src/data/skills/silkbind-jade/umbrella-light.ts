// Placeholder (validated: false). Wiki: Umbrella - Light Attack, listed by
// Blossom Barrage as one of the affected Combo-bonus recipients. The charged
// follow-up is "Spring Away" (a separate file).
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const umbrellaLight = defineSkill({
  id: SKILL.umbrellaLight,
  classId: "silkbindJade",
  name: "Umbrella Light",
  abilityTag: "Umbrella Light",
  tags: [PROP.isBallistic, WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaLight,
  castFrames: 30,
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
