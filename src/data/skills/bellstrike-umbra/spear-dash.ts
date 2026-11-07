import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06; cast after a sprint, which is not modelled.
export const spearDash = defineSkill({
  id: SKILL.spearDash,
  classId: "bellstrikeUmbra",
  name: "Spear - Dash",
  tags: [WEAPON.spear],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.umbraSpearDash,
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  castFrames: 39,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 20,
      physMultiplier: 0.62878,
      attributeMultiplier: 0.94317,
      physFixed: 175,
      attributeFixed: 95,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
