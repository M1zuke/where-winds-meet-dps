import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const swordSpecialDeflect = defineSkill({
  id: SKILL.swordSpecialDeflect,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial[Deflect]",
  breakdownName: "Shadow Step (deflect)",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecialDeflect,
  castFrames: 51,
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
