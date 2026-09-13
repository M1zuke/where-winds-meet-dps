import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const swordspecial2Hit = defineSkill({
  id: SKILL.swordspecial2Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 2-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial2Hit,
  receives: STRATEGIC_SWORD_RECEIVES,
  // A player-ended form: castFrames sits 11 frames past the frame at which the animation would accept the next input (in-game animation, 2026-09-09).
  castFrames: 47,
  triggerable: true,
  hits: SWORDSPECIAL_HITS.slice(0, 2),
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
