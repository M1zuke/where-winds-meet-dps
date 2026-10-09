import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

const ROW_SHARE = {
  physMultiplier: 0.31677,
  attributeMultiplier: 0.475155,
  physFixed: 88,
  attributeFixed: 48,
  extraCritDamage: 1,
}

// In-game values as of 2026-10-06: per-hit values are half of the row. Only
// one of the melee hit and the first volley counts per target; the second
// volley's two bullets both count. Frames are the launch frames.
export const umbrellaDual = defineSkill({
  id: SKILL.umbrellaDual,
  classId: "silkbindJade",
  name: "Umbrella (Dual-Weapon Skill)",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbrellaDual,
  receives: [BUFF.windWall, BUFF.trajectorySkill, ...VERNAL_UMBRELLA_RECEIVES],
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 46,
  triggerable: true,
  hits: [
    hit(0, { frame: 12, ...ROW_SHARE }),
    hit(1, {
      frame: 18,
      physMultiplier: ROW_SHARE.physMultiplier * 2,
      attributeMultiplier: ROW_SHARE.attributeMultiplier * 2,
      physFixed: ROW_SHARE.physFixed * 2,
      attributeFixed: ROW_SHARE.attributeFixed * 2,
      extraCritDamage: 1,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
