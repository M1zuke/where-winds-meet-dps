import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const swordSpecial = defineSkill({
  id: SKILL.swordSpecial,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial",
  breakdownName: "Shadow Step",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial,
  castFrames: 24,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.767,
      attributeMultiplier: 2.6505,
      physFixed: 409,
      attributeFixed: 228,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
