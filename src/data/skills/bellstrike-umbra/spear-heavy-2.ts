import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const spearHeavy2 = defineSkill({
  id: SKILL.spearHeavy2,
  classId: "bellstrikeUmbra",
  name: "Spear - Heavy Attack (Stage 2)",
  breakdownName: "Spear - Heavy Attack",
  tags: [WEAPON.spear, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearHeavy2,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castFrames: 43,
  triggerable: true,
  reachMeters: 5,
  hits: [
    hit(0, {
      frame: 22,
      ...levelScaled(LEVEL_ROWS.spearHeavy2Hit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
