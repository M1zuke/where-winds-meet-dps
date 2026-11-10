import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

const STRIKE = {
  ...levelScaled(LEVEL_ROWS.fanDualHit0),
}

// In-game values as of 2026-10-06: each strike is a melee hit and a
// projectile of which only the first lands; the melee hit is the earlier.
export const fanDual = defineSkill({
  id: SKILL.fanDual,
  classId: "silkbindJade",
  name: "Fan (Dual-Weapon Skill)",
  tags: [WEAPON.fan],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanDual,
  receives: [
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...INKWELL_FAN_RECEIVES,
  ],
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 51,
  triggerable: true,
  hits: [hit(0, { frame: 7, ...STRIKE }), hit(1, { frame: 36, ...STRIKE })],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
