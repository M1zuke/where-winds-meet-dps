import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_1_HITS } from "./sword-charge-stage-1-hits"

export const swordChargeStage14Hit = defineSkill({
  id: SKILL.swordChargeStage14Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 4-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage14Hit,
  // A player-ended form: castFrames is capped short of the follow-up window's open frame, 56.46 — an 11-frame margin would trigger the five-hit outcome instead (in-game animation, 2026-09-09).
  castFrames: 56,
  triggerable: true,
  hits: SWORD_CHARGE_STAGE_1_HITS.slice(0, 4),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
