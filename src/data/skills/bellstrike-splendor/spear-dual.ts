import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

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
      ...levelScaled(LEVEL_ROWS.spearDualHit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
