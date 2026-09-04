import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const kick = (index: number) =>
  hit(index, {
    frame: 60,
    physMultiplier: 0.9444,
    attributeMultiplier: 1.4166,
    physFixed: 262,
    attributeFixed: 143,
  })

// Four consecutive kicks, each the tooltip's full ratio of client
// skill_numerical_config row 20902108 (0.9444 / 262 / 143 at skill level
// 100, patch container 2026-09-04); attribute side × 1.5.
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
  castFrames: 60,
  hits: [kick(0), kick(1), kick(2), kick(3)],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
