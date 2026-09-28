import { defineSkill, evenlySpacedHits } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

export const soaring = defineSkill({
  id: SKILL.soaring,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Soaring",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.soaring,
  castFrames: 120,
  triggerable: true,
  // In-game values as of 2026-09-28: a stationary cast, 15 m engagement
  // range — confirmed no scripted displacement despite the visible dash-in.
  reachMeters: 15,
  approach: "stationary",
  hits: evenlySpacedHits({
    count: 2,
    everyFrames: 60,
    physMultiplier: 3.55121,
    attributeMultiplier: 5.326815,
    physFixed: 535.03,
    attributeFixed: 0,
  }),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
