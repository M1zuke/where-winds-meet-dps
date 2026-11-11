import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { DODGE_CONTEXT_TAG } from "../../../engine/buffs/tags"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST } from "../ids"
import { BRANCH_FORM_MIN_BREAKTHROUGH } from "./branchFormFloor"
import { SKILL } from "./ids"

// In-game values as of 2026-11-11: fired from the dodge's own graph, so the hit
// takes the drawn weapon's damage line and its flat-bonus ranks, and neither
// All Martial nor any mystic line.
export const ghostlyAfterimage = defineSkill({
  id: SKILL.ghostlyAfterimage,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Ghostly Afterimage",
  tags: [DODGE_CONTEXT_TAG],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.ghostlyAfterimage,
  minBreakthrough: BRANCH_FORM_MIN_BREAKTHROUGH,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 48,
      physMultiplier: 2.041567,
      attributeMultiplier: 3.062351,
      physFixed: 312,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
