import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const swordLight2 = defineSkill({
  id: SKILL.swordLight2,
  classId: "bellstrikeUmbra",
  name: "Sword - Light Attack (Stage 2)",
  breakdownName: "Sword - Light Attack",
  tags: [WEAPON.sword, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordLight2,
  receives: [BUFF.swallowcallLightAttackBoost, ...STRATEGIC_SWORD_RECEIVES],
  castFrames: 36,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 12,
      physMultiplier: 0.26903,
      attributeMultiplier: 0.403545,
      physFixed: 74.5,
      attributeFixed: 40.625,
    }),
    hit(1, {
      frame: 32,
      physMultiplier: 0.322836,
      attributeMultiplier: 0.484254,
      physFixed: 89.4,
      attributeFixed: 48.75,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
