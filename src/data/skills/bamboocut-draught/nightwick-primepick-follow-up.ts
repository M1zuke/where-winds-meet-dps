import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { DEBUFF, SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

// Cast length: community speed-rotation workbook v2.0, 2026-09-04, 0.6 s;
// hit spacing provisional.
export const nightwickPrimepickFollowUp = defineSkill({
  id: SKILL.nightwickPrimepickFollowUp,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick Follow-up",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepickFollowUp,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 36,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.64565,
      attributeMultiplier: 0.968475,
      physFixed: 180,
      attributeFixed: 98,
      triggers: [applyDebuff({ target: DEBUFF.wildstride, stacks: 1 })],
    }),
    hit(1, {
      frame: 18,
      physMultiplier: 0.859716,
      attributeMultiplier: 1.289574,
      physFixed: 237.93,
      attributeFixed: 129.69,
      conditions: [{ buffId: STATUS.inebriateDeepdaze, op: "gte", stacks: 1 }],
      triggers: [applyDebuff({ target: DEBUFF.nightwickExposure, stacks: 1, phase: "exhausted" })],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
