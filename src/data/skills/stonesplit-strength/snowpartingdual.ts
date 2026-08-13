import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const snowpartingdual = defineSkill({
  id: SKILL.snowpartingdual,
  classId: "stonesplitStrength",
  name: "SnowpartingDual",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingDual,
  castFrames: 35,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.6486,
      attributeMultiplier: 0.9729,
      physFixed: 180,
      attributeFixed: 98,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
