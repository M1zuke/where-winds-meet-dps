import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { DEBUFF, SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

// The airborne follow-up of Reveldrift. Coefficients: the in-game level-100
// row (0.804 / 223 / 122, 2026-09-04) at the tooltip's full ratio as one hit;
// attribute side × 1.5. Cast length and hit frame: in-game animation,
// 2026-09-05.
export const realmplay = defineSkill({
  id: SKILL.realmplay,
  classId: "bamboocutDraught",
  name: "Realmplay",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesMartialArt],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.realmplay,
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggerable: false,
  castFrames: 28,
  hits: [
    hit(0, {
      frame: 10,
      physMultiplier: 0.804,
      attributeMultiplier: 1.206,
      physFixed: 223,
      attributeFixed: 122,
      triggers: [applyDebuff({ target: DEBUFF.strayhunt, stacks: 1 })],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
