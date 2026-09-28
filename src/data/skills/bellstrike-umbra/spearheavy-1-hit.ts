import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { DRIFTING_THRUST_DRAIN, DRIFTING_THRUST_FREEZE } from "./buffs/driftingThrustEndurance"

export const spearheavy1Hit = defineSkill({
  id: SKILL.spearheavy1Hit,
  classId: "bellstrikeUmbra",
  breakdownName: "Drifting Thrust",
  name: "SpearHeavy 1-Hit",
  // Not a Heavy Attack for Mistwillow: in-game values as of 2026-09-24.
  tags: [WEAPON.spear, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavy1Hit,
  triggersBuffs: [BUFF.soulShaken],
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  meterDrains: DRIFTING_THRUST_DRAIN,
  meterFreezes: DRIFTING_THRUST_FREEZE,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 60,
  triggerable: true,
  hits: [
    // Coefficients: in-game values, 2026-09-10.
    hit(0, {
      frame: 25,
      physMultiplier: 1.250878,
      attributeMultiplier: 1.876317,
      physFixed: 346,
      attributeFixed: 188.6,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
})
