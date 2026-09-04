import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const pursuit = (index: number) =>
  hit(index, {
    frame: 60,
    physMultiplier: 0.57198,
    attributeMultiplier: 0.85797,
    physFixed: 158.25,
    attributeFixed: 86.25,
    triggers: [applyDebuff({ target: DEBUFF.nightwickExposure, stacks: 1, phase: "exhausted" })],
  })

// Client skill_numerical_config row 20902109 (2.28792 / 633 / 345 at skill
// level 100, patch container 2026-09-04) at the tooltip's 0.25 per hit;
// four hits is a provisional count. Attribute side × 1.5.
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
  castFrames: 60,
  hits: [pursuit(0), pursuit(1), pursuit(2), pursuit(3)],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
