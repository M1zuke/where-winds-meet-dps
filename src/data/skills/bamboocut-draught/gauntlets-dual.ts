import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const gauntletsDual = defineSkill({
  id: SKILL.gauntletsDual,
  classId: "bamboocutDraught",
  name: "Gauntlets (Dual-Weapon Skill)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.gauntletsDual,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 48,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 17,
      ...levelScaled(LEVEL_ROWS.gauntletsDualHit0),
    }),
    hit(1, {
      frame: 40,
      ...levelScaled(LEVEL_ROWS.gauntletsDualHit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
