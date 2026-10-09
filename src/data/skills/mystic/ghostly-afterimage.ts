import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-10-06: fired from the dodge, so no mystic category
// boost reaches it.
export const ghostlyAfterimage = defineSkill({
  id: SKILL.ghostlyAfterimage,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Ghostly Afterimage",
  tags: [],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.ghostlyAfterimage,
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
