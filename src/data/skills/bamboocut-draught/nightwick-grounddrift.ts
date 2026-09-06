import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const pursuit = (index: number, frame: number) =>
  hit(index, {
    frame,
    physMultiplier: 0.57198,
    attributeMultiplier: 0.85797,
    physFixed: 158.25,
    attributeFixed: 86.25,
  })

// Client skill_numerical_config row 20902109 (2.28792 / 633 / 345 at skill
// level 100, patch container 2026-09-04) at the tooltip's 0.25 per hit;
// four hits is a provisional count. Attribute side × 1.5. Cast length and hit
// frames: in-game animation, 2026-09-05.
export const nightwickGrounddrift = defineSkill({
  id: SKILL.nightwickGrounddrift,
  classId: "bamboocutDraught",
  name: "Nightwick - Grounddrift",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickGrounddrift,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 93,
  hits: [pursuit(0, 8), pursuit(1, 24), pursuit(2, 56), pursuit(3, 88)],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
