import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORDSPECIAL_HITS } from "./swordspecial-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const swordspecial4HitFinal = defineSkill({
  id: SKILL.swordspecial4HitFinal,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 4-Hit (Hit 4)",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial4HitFinal,
  receives: STRATEGIC_SWORD_RECEIVES,
  castFrames: 0,
  triggerable: true,
  // Hit 4 lands 75.96 f into the cast, 32.52 f after the hit that casts this.
  hits: [
    {
      ...SWORDSPECIAL_HITS[3]!,
      id: "hit-0",
      frame: 32.52,
    },
  ],
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
