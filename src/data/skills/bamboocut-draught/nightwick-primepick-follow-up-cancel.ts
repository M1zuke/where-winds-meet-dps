import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"
import { primepickFollowUpHits } from "./nightwick-primepick-follow-up"

// A cancel form ends one frame after its last landed collider; the drink
// that ends it is the next rotation step.
export const nightwickPrimepickFollowUpCancel = defineSkill({
  id: SKILL.nightwickPrimepickFollowUpCancel,
  classId: "bamboocutDraught",
  name: "Gauntlet Special - Primepick Follow-up [1-hit cancel]",
  breakdownName: "Nightwick - Primepick",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.nightwickPrimepickFollowUpCancel,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggerable: false,
  castFrames: 21,
  hits: [primepickFollowUpHits[0]],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
