import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

const VOLLEY_HIT = {
  physMultiplier: 0.31677,
  attributeMultiplier: 0.475155,
  physFixed: 88,
  attributeFixed: 48,
}

// In-game values as of 2026-10-12: at most two damaging hits per target — the
// two projectile volleys, landing about 7 frames after their launch at 12 and
// 18 frames. The collider and the first volley share one damage slot, and the
// volley arrives first in melee.
export const umbrellaDual = defineSkill({
  id: SKILL.umbrellaDual,
  classId: "bamboocutDust",
  name: "Umbrella (Dual-Weapon Skill)",
  tags: [WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustUmbrellaDual,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  isWeaponSwap: true,
  castFrames: 46,
  triggerable: false,
  hits: [hit(0, { frame: 19, ...VOLLEY_HIT }), hit(1, { frame: 25, ...VOLLEY_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
