import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const swordLight4 = defineSkill({
  id: SKILL.swordLight4,
  classId: "bellstrikeUmbra",
  name: "Sword - Light Attack (Stage 4)",
  breakdownName: "Sword - Light Attack",
  tags: [WEAPON.sword, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordLight4,
  receives: [BUFF.swallowcallLightAttackBoost, ...STRATEGIC_SWORD_RECEIVES],
  castFrames: 33,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 13,
      physMultiplier: 0.645672,
      attributeMultiplier: 0.968508,
      physFixed: 178.8,
      attributeFixed: 97.5,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
