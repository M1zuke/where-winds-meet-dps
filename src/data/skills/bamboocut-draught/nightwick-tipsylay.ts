import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

// One kick at the special skill's full share (0.9444 / 262 / 143 at skill
// level 100, in-game damage tooltip, 2026-09-04); attribute side × 1.5. Cast
// length and hit frame: in-game animation, 2026-09-05, which carries a single
// collider.
export const nightwickTipsylay = defineSkill({
  id: SKILL.nightwickTipsylay,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Tipsylay",
  breakdownName: "Nightwick - Tipsylay",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickTipsylay,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 39,
  hits: [
    hit(0, {
      frame: 20,
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
