import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { primepickFollowUpHits } from "./nightwick-primepick-follow-up"

// A cancel form ends where the drink that follows it is first able to
// interrupt, not one frame after its own last landed collider — in-game
// animation, 2026-09-24. The drink itself is the next rotation step.
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
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    BUFF.nonPlayerBaseDamage40,
  ],
  triggerable: false,
  castFrames: 39,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [primepickFollowUpHits[0]],
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
