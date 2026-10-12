import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { RESONANCE_HIT } from "./resonance"

export const resonanceDreamwrought = defineSkill({
  id: SKILL.resonanceDreamwrought,
  classId: "bamboocutDust",
  name: "Resonance (Dreamwrought Bubbles)",
  breakdownName: "Resonance",
  tags: [WEAPON.umbrella, ROLE.dustResonance],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustResonanceDreamwrought,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...RESONANCE_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
