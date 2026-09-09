import { defineSkill } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"

export const swordspecial4Hit = defineSkill({
  id: SKILL.swordspecial4Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 4-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial4Hit,
  // A player-ended form: castFrames is capped at the animation's own end frame, 84 — an 11-frame margin would run past it (in-game animation, 2026-09-09).
  castFrames: 84,
  triggerable: true,
  hits: SWORDSPECIAL_HITS.slice(0, 4),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
