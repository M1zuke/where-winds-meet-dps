import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// The airborne follow-up of Reveldrift. Coefficients: client
// skill_numerical_config row 20503102 at skill level 100 (patch container,
// 2026-09-04): 0.804 / 223 / 122 at the tooltip's full ratio as one hit;
// attribute side × 1.5.
export const realmplay = defineSkill({
  id: SKILL.realmplay,
  classId: "bamboocutDraught",
  name: "Realmplay",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.realmplay,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 60,
  hits: [
    hit(0, {
      frame: 60,
      physMultiplier: 0.804,
      attributeMultiplier: 1.206,
      physFixed: 223,
      attributeFixed: 122,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
