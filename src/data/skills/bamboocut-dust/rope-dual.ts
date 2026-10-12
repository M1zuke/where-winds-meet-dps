import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UNFETTERED_ROPE_DART_RECEIVES } from "./receives"

// In-game values as of 2026-10-12. The hit frame is not measurable:
// provisional frame, half the cast.
export const ropeDual = defineSkill({
  id: SKILL.ropeDual,
  classId: "bamboocutDust",
  name: "Rope Dart (Dual-Weapon Skill)",
  tags: [WEAPON.ropeDart],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustRopeDual,
  receives: UNFETTERED_ROPE_DART_RECEIVES,
  isWeaponSwap: true,
  castFrames: 35,
  triggerable: false,
  hits: [
    hit(0, {
      frame: 18,
      physMultiplier: 0.87463,
      attributeMultiplier: 1.311945,
      physFixed: 243,
      attributeFixed: 132,
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
