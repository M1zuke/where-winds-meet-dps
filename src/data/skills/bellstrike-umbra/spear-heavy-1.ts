import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: the tap, which starts 18 f after the press.
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
  castFrames: 66,
  triggerable: true,
  reachMeters: 5,
  hits: [
    hit(0, {
      frame: 43,
      physMultiplier: 0.838872,
      attributeMultiplier: 1.258308,
      physFixed: 232.2,
      attributeFixed: 126.6,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
