import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
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
      frame: 14,
      physMultiplier: 0.219191,
      attributeMultiplier: 0.3287865,
      physFixed: 60.7,
      attributeFixed: 33.1,
    }),
    hit(1, {
      frame: 31,
      physMultiplier: 0.3287865,
      attributeMultiplier: 0.49317975,
      physFixed: 91.05,
      attributeFixed: 49.65,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
