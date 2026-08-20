import { defineSkill, evenlySpacedHits } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const healerExtension = defineSkill({
  id: SKILL.healerExtension,
  classId: "silkbindJade",
  name: "Healer Extension",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Silkbind",
  castTag: CAST.healerExtension,
  castFrames: 180,
  triggerable: true,
  hits: evenlySpacedHits({
    count: 10,
    everyFrames: 18,
    physMultiplier: 0.19388,
    attributeMultiplier: 0.290832,
    physFixed: 44.8,
    attributeFixed: 25.04,
  }),
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
