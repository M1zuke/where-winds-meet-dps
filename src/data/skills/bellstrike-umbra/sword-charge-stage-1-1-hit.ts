import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_1_DISPLACEMENT, SWORD_CHARGE_STAGE_1_HITS } from "./sword-charge-stage-1-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import {
  SECOND_TRACK_SLASH_COST,
  SECOND_TRACK_SLASH_DRAIN,
  SECOND_TRACK_SLASH_FREEZE,
} from "./buffs/secondTrackSlashEndurance"

export const swordChargeStage11Hit = defineSkill({
  id: SKILL.swordChargeStage11Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 1-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage11Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  meterCosts: [SECOND_TRACK_SLASH_COST],
  meterDrains: SECOND_TRACK_SLASH_DRAIN,
  meterFreezes: SECOND_TRACK_SLASH_FREEZE,
  // The 31 f minimum hold to reach stage 1, then castFrames 11 frames past
  // the frame at which the animation would accept the next input (in-game
  // animation, 2026-10-06).
  castFrames: 49,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  hits: SWORD_CHARGE_STAGE_1_HITS.slice(0, 1),
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
