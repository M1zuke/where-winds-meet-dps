import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const spearLight4 = defineSkill({
  id: SKILL.spearLight4,
  classId: "bellstrikeUmbra",
  name: "Spear - Light Attack (Stage 4)",
  breakdownName: "Spear - Light Attack",
  tags: [WEAPON.spear, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearLight4,
  receives: [BUFF.swallowcallLightAttackBoost, ...HEAVENQUAKER_SPEAR_RECEIVES],
  castFrames: 59,
  triggerable: true,
  reachMeters: 4.5,
  hits: [
    hit(0, {
      frame: 12,
      ...levelScaled(LEVEL_ROWS.spearLight3Hit0),
    }),
    hit(1, {
      frame: 23,
      ...levelScaled(LEVEL_ROWS.spearLight3Hit0),
    }),
    hit(2, {
      frame: 40,
      ...levelScaled(LEVEL_ROWS.spearLight4Hit2),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
