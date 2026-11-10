import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-06; cast after a sprint, which is not modelled.
export const swordDash = defineSkill({
  id: SKILL.swordDash,
  classId: "bellstrikeUmbra",
  name: "Sword - Dash",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSwordDash,
  receives: STRATEGIC_SWORD_RECEIVES,
  castFrames: 41,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 8,
      ...levelScaled(LEVEL_ROWS.swordDashHit0),
    }),
    hit(1, {
      frame: 26,
      ...levelScaled(LEVEL_ROWS.swordDashHit1),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
