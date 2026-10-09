import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

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
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.479274,
      attributeMultiplier: 0.718911,
      physFixed: 132.6,
      attributeFixed: 72.2,
    }),
    hit(1, {
      frame: 48,
      physMultiplier: 0.718911,
      attributeMultiplier: 1.0783665,
      physFixed: 198.9,
      attributeFixed: 108.3,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
