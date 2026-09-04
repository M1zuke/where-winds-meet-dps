import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

// Cast length: community speed-rotation workbook v2.0, 2026-09-04, 0.9 s.
export const nightwickPrimepick = defineSkill({
  id: SKILL.nightwickPrimepick,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepick,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 54,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
