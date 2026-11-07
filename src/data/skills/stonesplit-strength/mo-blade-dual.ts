import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const moBladeDual = defineSkill({
  id: SKILL.moBladeDual,
  classId: "stonesplitStrength",
  name: "Mo Blade (Dual-Weapon Skill)",
  tags: [WEAPON.moBlade],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.moBladeDual,
  receives: PHALANXBANE_BLADE_RECEIVES,
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 50,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 29,
      physMultiplier: 1.42642,
      attributeMultiplier: 2.13963,
      physFixed: 395,
      attributeFixed: 215,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
