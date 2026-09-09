import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_1_HITS } from "./sword-charge-stage-1-hits"

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
  // A player-ended form: castFrames sits 11 frames past the frame at which the animation would accept the next input (in-game animation, 2026-09-09).
  castFrames: 52,
  triggerable: true,
  hits: SWORD_CHARGE_STAGE_1_HITS.slice(0, 3),
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
