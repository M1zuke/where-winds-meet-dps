import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06.
export const swordDual = defineSkill({
  id: SKILL.swordDual,
  classId: "bellstrikeSplendor",
  name: "Sword (Dual-Weapon Skill)",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSwordDual,
  receives: NAMELESS_SWORD_RECEIVES,
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 47,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 13,
      ...levelScaled(LEVEL_ROWS.swordDualHit0),
    }),
    hit(1, {
      frame: 33,
      ...levelScaled(LEVEL_ROWS.swordDualHit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
