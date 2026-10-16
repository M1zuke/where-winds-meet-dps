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
  // The 31 f minimum hold to reach stage 1, then one frame past the last kept
  // hit (41.25 f after the release), where a follow-up breaks the release at
  // its press: in-game values as of 2026-10-16.
  castFrames: 72.25,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  hits: SWORD_CHARGE_STAGE_1_HITS.slice(0, 3),
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
