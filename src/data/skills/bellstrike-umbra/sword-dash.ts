import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

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
      physMultiplier: 0.173364,
      attributeMultiplier: 0.260046,
      physFixed: 48.2,
      attributeFixed: 26.2,
    }),
    hit(1, {
      frame: 26,
      physMultiplier: 0.693456,
      attributeMultiplier: 1.040184,
      physFixed: 192.8,
      attributeFixed: 104.8,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
