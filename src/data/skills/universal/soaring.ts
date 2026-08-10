import { defineSkill, dotTicks } from "../define"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

export const soaring = defineSkill({
  id: SKILL.soaring,
  classId: "universal",
  name: "Soaring",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.soaring,
  castFrames: 120,
  triggerable: true,
  hits: dotTicks({
    count: 2,
    everyFrames: 60,
    physMultiplier: 3.5537,
    attributeMultiplier: 5.3298,
    physFixed: 660,
    attributeFixed: 0,
  }),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
