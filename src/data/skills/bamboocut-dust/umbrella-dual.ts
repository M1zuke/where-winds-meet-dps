import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UMBRELLA_PROJECTILE_RECEIVES } from "./receives"

const VOLLEY_HIT = {
  physMultiplier: 0.31677,
  attributeMultiplier: 0.475155,
  physFixed: 88,
  attributeFixed: 48,
}

// In-game values as of 2026-10-13: the collider and the second volley; the
// first volley deals no damage to a dummy.
export const umbrellaDual = defineSkill({
  id: SKILL.umbrellaDual,
  classId: "bamboocutDust",
  name: "Umbrella (Dual-Weapon Skill)",
  tags: [WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustUmbrellaDual,
  receives: UMBRELLA_PROJECTILE_RECEIVES,
  isWeaponSwap: true,
  castFrames: 46,
  triggerable: false,
  hits: [hit(0, { frame: 23, ...VOLLEY_HIT }), hit(1, { frame: 33, ...VOLLEY_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
