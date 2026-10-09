import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import {
  SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  SWORD_CHARGE_STAGE_1_HITS,
  SWORD_CHARGE_STAGE_1_HIT_4_INTO_FOLLOW_UP,
} from "./sword-charge-stage-1-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import {
  SECOND_TRACK_SLASH_COST,
  SECOND_TRACK_SLASH_DRAIN,
  SECOND_TRACK_SLASH_FREEZE,
} from "./buffs/secondTrackSlashEndurance"

export const swordChargeStage13Hit = defineSkill({
  id: SKILL.swordChargeStage13Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 3-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage13Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  meterCosts: [SECOND_TRACK_SLASH_COST],
  meterDrains: SECOND_TRACK_SLASH_DRAIN,
  meterFreezes: SECOND_TRACK_SLASH_FREEZE,
  // Cut short by a Deflect: the 31 f minimum hold to reach stage 1, then
  // castFrames 11 frames past the frame at which the animation would accept
  // the next input (in-game animation, 2026-10-06). Cut short into the
  // follow-up instead, hit 4 still lands and its own `castFramesWhenGated`
  // overrides this length.
  castFrames: 83,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  hits: [...SWORD_CHARGE_STAGE_1_HITS.slice(0, 3), SWORD_CHARGE_STAGE_1_HIT_4_INTO_FOLLOW_UP],
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
