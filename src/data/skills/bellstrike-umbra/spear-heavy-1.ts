import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-11-10: the tap on the quickest release, 3.6 f after
// the press; a press held to 0.3 s becomes the charge instead.
export const spearHeavy1 = defineSkill({
  id: SKILL.spearHeavy1,
  classId: "bellstrikeUmbra",
  name: "Spear - Heavy Attack (Stage 1)",
  breakdownName: "Spear - Heavy Attack",
  tags: [WEAPON.spear, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearHeavy1,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castFrames: 52.2,
  triggerable: true,
  reachMeters: 5,
  hits: [
    hit(0, {
      frame: 29.53,
      ...levelScaled(LEVEL_ROWS.spearHeavy1Hit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
