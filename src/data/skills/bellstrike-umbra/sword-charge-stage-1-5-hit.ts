import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_1_HITS } from "./sword-charge-stage-1-hits"

export const swordChargeStage15Hit = defineSkill({
  id: SKILL.swordChargeStage15Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 5-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage15Hit,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 121,
  triggerable: true,
  hits: SWORD_CHARGE_STAGE_1_HITS,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
