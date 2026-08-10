import { defineSkill, hit } from "../define"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const perfectDodgeFull = defineSkill({
  id: SKILL.perfectDodgeFull,
  classId: "universal",
  name: "Perfect Dodge[Full]",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.perfectDodgeFull,
  castFrames: 50,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
