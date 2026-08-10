import { defineSkill, hit } from "../define"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const ghostlySteps = defineSkill({
  id: SKILL.ghostlySteps,
  classId: "universal",
  name: "Ghostly Steps",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.ghostlySteps,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
