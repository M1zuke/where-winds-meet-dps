import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const spearheavy1Hit = defineSkill({
  id: SKILL.spearheavy1Hit,
  classId: "bellstrikeUmbra",
  breakdownName: "Drifting Thrust",
  name: "SpearHeavy 1-Hit",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavy1Hit,
  triggersBuffs: [BUFF.soulShaken],
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
