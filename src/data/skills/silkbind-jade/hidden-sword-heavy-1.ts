import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// The heavy attack available while Unfading Flower's umbrella floats.
// Vernal Umbrella never reaches this row's own charged branch (it needs
// Soulshade Umbrella's own resource), so only the plain 3-stage chain is
// modelled. In-game values as of 2026-09-24.
export const hiddenSwordHeavy1 = defineSkill({
  id: SKILL.hiddenSwordHeavy1,
  classId: "silkbindJade",
  name: "Hidden Sword - Heavy Attack (Stage 1)",
  breakdownName: "Hidden Sword - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordHeavy1,
  receives: [BUFF.thunderousBloom, BUFF.springThunder, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 37,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach.
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 24,
      ...levelScaled(LEVEL_ROWS.umblightchargeLiftHit0),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
