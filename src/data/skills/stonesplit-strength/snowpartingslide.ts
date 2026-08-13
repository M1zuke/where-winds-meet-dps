import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const snowpartingslide = defineSkill({
  id: SKILL.snowpartingslide,
  classId: "stonesplitStrength",
  name: "SnowpartingSlide",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSlide,
  castFrames: 42,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.2338,
      attributeMultiplier: 1.8507,
      physFixed: 342,
      attributeFixed: 186,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
