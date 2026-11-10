import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const spearLight3 = defineSkill({
  id: SKILL.spearLight3,
  classId: "bellstrikeUmbra",
  name: "Spear - Light Attack (Stage 3)",
  breakdownName: "Spear - Light Attack",
  tags: [WEAPON.spear, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearLight3,
  receives: [BUFF.swallowcallLightAttackBoost, ...HEAVENQUAKER_SPEAR_RECEIVES],
  castFrames: 42,
  triggerable: true,
  reachMeters: 4.5,
  hits: [
    hit(0, {
      frame: 18,
      ...levelScaled(LEVEL_ROWS.spearLight3Hit0),
    }),
    hit(1, {
      frame: 35,
      ...levelScaled(LEVEL_ROWS.spearLight1Hit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
