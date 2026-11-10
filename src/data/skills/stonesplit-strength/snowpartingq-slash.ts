import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const snowpartingqSlash = defineSkill({
  id: SKILL.snowpartingqSlash,
  classId: "stonesplitStrength",
  name: "SnowpartingQ-Slash",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingQSlash,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [BUFF.jadeware],
  castFrames: 40,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 14,
      ...levelScaled(LEVEL_ROWS.snowpartingqSlashHit0),
    }),
    hit(1, {
      frame: 29,
      ...levelScaled(LEVEL_ROWS.snowpartingqSlashHit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
