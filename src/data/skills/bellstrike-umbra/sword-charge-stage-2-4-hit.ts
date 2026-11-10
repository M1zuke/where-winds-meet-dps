import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_2_4_HIT_DISPLACEMENT } from "./rootMotion"
import { SWORD_CHARGE_STAGE_2_HITS } from "./sword-charge-stage-2-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import {
  SECOND_TRACK_SLASH_COST,
  SECOND_TRACK_SLASH_FREEZE,
  SECOND_TRACK_SLASH_STAGE_2_DRAIN,
} from "./buffs/secondTrackSlashEndurance"

export const swordChargeStage24Hit = defineSkill({
  id: SKILL.swordChargeStage24Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 2, 4-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage24Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  meterCosts: [SECOND_TRACK_SLASH_COST],
  meterDrains: SECOND_TRACK_SLASH_STAGE_2_DRAIN,
  meterFreezes: SECOND_TRACK_SLASH_FREEZE,
  // The 85 f minimum hold to reach stage 2, then one frame past the last kept
  // hit (51.11 f after the release), where a follow-up breaks the release at
  // its press: in-game values as of 2026-10-16.
  castFrames: 136.11,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_2_4_HIT_DISPLACEMENT,
  hits: SWORD_CHARGE_STAGE_2_HITS.slice(0, 4),
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
