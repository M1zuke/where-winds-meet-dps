import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const swordSpecial2nd = defineSkill({
  id: SKILL.swordSpecial2nd,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial[2nd]",
  breakdownName: "Shadow Step (2nd)",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial2nd,
  castFrames: 24,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.767,
      attributeMultiplier: 2.6505,
      physFixed: 356,
      attributeFixed: 202,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
