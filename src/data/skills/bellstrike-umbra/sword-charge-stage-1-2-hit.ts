import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import {
  SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  SWORD_CHARGE_STAGE_1_HITS,
  SWORD_CHARGE_STAGE_1_HIT_3_INTO_FOLLOW_UP,
  SWORD_CHARGE_STAGE_1_HIT_4_INTO_FOLLOW_UP,
} from "./sword-charge-stage-1-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import {
  SECOND_TRACK_SLASH_COST,
  SECOND_TRACK_SLASH_DRAIN,
  SECOND_TRACK_SLASH_FREEZE,
} from "./buffs/secondTrackSlashEndurance"

export const swordChargeStage12Hit = defineSkill({
  id: SKILL.swordChargeStage12Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 2-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage12Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  meterCosts: [SECOND_TRACK_SLASH_COST],
  meterDrains: SECOND_TRACK_SLASH_DRAIN,
  meterFreezes: SECOND_TRACK_SLASH_FREEZE,
  // Cut short by a Deflect: the 30 f minimum hold to reach stage 1, then
  // castFrames 11 frames past the frame at which the animation would accept
  // the next input (in-game animation, 2026-09-24). Cut short into the
  // follow-up instead, hit 3 and hit 4 still land and `castFramesWhenGated`
  // on the last of them overrides this length.
  castFrames: 72,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  hits: [
    ...SWORD_CHARGE_STAGE_1_HITS.slice(0, 2),
    SWORD_CHARGE_STAGE_1_HIT_3_INTO_FOLLOW_UP,
    SWORD_CHARGE_STAGE_1_HIT_4_INTO_FOLLOW_UP,
  ],
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
