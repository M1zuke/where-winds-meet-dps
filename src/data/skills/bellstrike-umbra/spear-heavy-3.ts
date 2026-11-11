import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const spearHeavy3 = defineSkill({
  id: SKILL.spearHeavy3,
  classId: "bellstrikeUmbra",
  name: "Spear - Heavy Attack (Stage 3)",
  breakdownName: "Spear - Heavy Attack",
  tags: [WEAPON.spear, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearHeavy3,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castFrames: 72,
  triggerable: true,
  reachMeters: 5,
  hits: [
    hit(0, {
      frame: 59,
      ...levelScaled(LEVEL_ROWS.spearHeavy3Hit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
