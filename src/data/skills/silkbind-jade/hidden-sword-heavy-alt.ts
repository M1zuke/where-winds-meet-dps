import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// The un-combo-linked heavy form. In-game values as of 2026-09-24.
export const hiddenSwordHeavyAlt = defineSkill({
  id: SKILL.hiddenSwordHeavyAlt,
  classId: "silkbindJade",
  name: "Hidden Sword - Heavy Attack (Alt)",
  breakdownName: "Hidden Sword - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordHeavyAlt,
  receives: [BUFF.thunderousBloom, BUFF.springThunder, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 35,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      // In-game values as of 2026-11-10: the collider lands 14.15 f into the
      // cast.
      frame: 14.15,
      ...levelScaled(LEVEL_ROWS.hiddenSwordHeavyAltHit0),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
