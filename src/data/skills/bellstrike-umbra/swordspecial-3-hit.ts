import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"

export const swordspecial3Hit = defineSkill({
  id: SKILL.swordspecial3Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 3-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial3Hit,
  // A player-ended form: castFrames sits 11 frames past the frame at which the animation would accept the next input (in-game animation, 2026-09-09).
  castFrames: 57,
  triggerable: true,
  hits: SWORDSPECIAL_HITS.slice(0, 3),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
