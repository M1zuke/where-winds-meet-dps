import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const spearDual = defineSkill({
  id: SKILL.spearDual,
  classId: "bellstrikeUmbra",
  name: "Spear (Dual-Weapon Skill)",
  tags: [WEAPON.spear],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearDual,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 18,
      physMultiplier: 0.966,
      attributeMultiplier: 1.449,
      physFixed: 268,
      attributeFixed: 146,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
