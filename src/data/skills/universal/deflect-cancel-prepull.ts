import { defineSkill, hit } from "../define"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const deflectCancelPrepull = defineSkill({
  id: SKILL.deflectCancelPrepull,
  classId: "universal",
  name: "Deflect Cancel Prepull",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.deflectCancelPrepull,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
