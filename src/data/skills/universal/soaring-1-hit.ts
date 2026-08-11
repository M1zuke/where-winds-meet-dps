import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

export const soaring1Hit = defineSkill({
  id: SKILL.soaring1Hit,
  classId: "universal",
  name: "Soaring 1-Hit",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.soaring1Hit,
  castFrames: 60,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 3.1951, attributeMultiplier: 4.7927, physFixed: 432, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
