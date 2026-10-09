import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: chained straight into stage 4, the third
// hit lands after the cast ends and is cut.
export const swordLight3 = defineSkill({
  id: SKILL.swordLight3,
  classId: "bellstrikeUmbra",
  name: "Sword - Light Attack (Stage 3)",
  breakdownName: "Sword - Light Attack",
  tags: [WEAPON.sword, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordLight3,
  receives: [BUFF.swallowcallLightAttackBoost, ...STRATEGIC_SWORD_RECEIVES],
  castFrames: 33,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 8,
      physMultiplier: 0.322836,
      attributeMultiplier: 0.484254,
      physFixed: 89.4,
      attributeFixed: 48.75,
    }),
    hit(1, {
      frame: 21,
      physMultiplier: 0.161418,
      attributeMultiplier: 0.242127,
      physFixed: 44.7,
      attributeFixed: 24.375,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
