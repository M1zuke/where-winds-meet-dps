import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

export const soaring1Hit = defineSkill({
  id: SKILL.soaring1Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Soaring 1-Hit",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.soaring1Hit,
  // Cast length to the earliest next input and the hit frame: in-game
  // animation, 2026-09-24.
  castFrames: 76,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 15,
  // In-game values as of 2026-09-28: a stationary cast, 15 m engagement
  // range — confirmed no scripted displacement despite the visible dash-in.
  reachMeters: 15,
  approach: "stationary",
  // In-game values as of 2026-10-15, level 76.
  hits: [
    hit(0, {
      frame: 48,
      physMultiplier: 3.196543,
      attributeMultiplier: 4.794815,
      physFixed: 504.027,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
