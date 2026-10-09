import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: only the first of the clip's two hits
// lands, at half of the row.
export const spearDual = defineSkill({
  id: SKILL.spearDual,
  classId: "bellstrikeSplendor",
  name: "Spear (Dual-Weapon Skill)",
  tags: [WEAPON.spear],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSpearDual,
  receives: NAMELESS_SPEAR_RECEIVES,
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 18,
      physMultiplier: 0.483,
      attributeMultiplier: 0.7245,
      physFixed: 134,
      attributeFixed: 73,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
