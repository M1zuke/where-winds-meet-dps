import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const blockperception = defineSkill({
  id: SKILL.blockperception,
  classId: "stonesplitStrength",
  name: "BlockPerception",
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Stonesplit",
  castTag: CAST.blockPerception,
  castFrames: 15,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
