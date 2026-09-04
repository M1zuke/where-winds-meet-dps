import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { whaledraftTriggers } from "./whaledraft"

// Cast length: community speed-rotation workbook v2.0, 2026-09-04, 0.7 s.
export const whaledraftCancel = defineSkill({
  id: SKILL.whaledraftCancel,
  classId: "bamboocutDraught",
  name: "Gauntlet Heavy Attack [cancel]",
  breakdownName: "Whaledraft",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraftCancel,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 42,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: whaledraftTriggers,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
