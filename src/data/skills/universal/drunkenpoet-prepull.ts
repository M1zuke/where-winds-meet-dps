import { defineSkill, hit } from "../define"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

export const drunkenpoetPrepull = defineSkill({
  id: SKILL.drunkenpoetPrepull,
  classId: "universal",
  name: "DrunkenPoet Prepull",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.drunkenPoetPrepull,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
