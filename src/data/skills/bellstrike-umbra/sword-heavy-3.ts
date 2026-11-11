import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { SWORD_HEAVY_3_MOTION } from "./rootMotion"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const swordHeavy3 = defineSkill({
  id: SKILL.swordHeavy3,
  classId: "bellstrikeUmbra",
  name: "Sword - Heavy Attack (Stage 3)",
  breakdownName: "Sword - Heavy Attack",
  tags: [WEAPON.sword, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordHeavy3,
  receives: STRATEGIC_SWORD_RECEIVES,
  castFrames: 73,
  triggerable: true,
  displacement: SWORD_HEAVY_3_MOTION,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 14,
      ...levelScaled(LEVEL_ROWS.swordChargeStage1Level0Hit0),
    }),
    hit(1, {
      frame: 48,
      ...levelScaled(LEVEL_ROWS.swordHeavy3Hit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
