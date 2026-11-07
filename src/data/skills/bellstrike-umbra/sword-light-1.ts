import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const swordLight1 = defineSkill({
  id: SKILL.swordLight1,
  classId: "bellstrikeUmbra",
  name: "Sword - Light Attack (Stage 1)",
  breakdownName: "Sword - Light Attack",
  tags: [WEAPON.sword, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordLight1,
  receives: [BUFF.swallowcallLightAttackBoost, ...STRATEGIC_SWORD_RECEIVES],
  castFrames: 31,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 22,
      physMultiplier: 0.26903,
      attributeMultiplier: 0.403545,
      physFixed: 74.5,
      attributeFixed: 40.625,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
