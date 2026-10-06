import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const swordHeavy2 = defineSkill({
  id: SKILL.swordHeavy2,
  classId: "bellstrikeUmbra",
  name: "Sword - Heavy Attack (Stage 2)",
  breakdownName: "Sword - Heavy Attack",
  tags: [WEAPON.sword, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordHeavy2,
  receives: STRATEGIC_SWORD_RECEIVES,
  castFrames: 53,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 10,
      physMultiplier: 0.3594555,
      attributeMultiplier: 0.53918325,
      physFixed: 99.45,
      attributeFixed: 54.15,
    }),
    hit(1, {
      frame: 44,
      physMultiplier: 0.3594555,
      attributeMultiplier: 0.53918325,
      physFixed: 99.45,
      attributeFixed: 54.15,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
