import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// The falcon the sixth light attack unleashes: client skill_numerical_config
// row 20902814 (1.4784, no flat adds, a single level; patch container
// 2026-09-04), attribute side × 1.5, carried as one hit.
export const falconsPursuit = defineSkill({
  id: SKILL.falconsPursuit,
  classId: "bamboocutDraught",
  name: "Falcon's Pursuit",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.falconsPursuit,
  receives: CLASS_RECEIVES,
  triggerable: true,
  castFrames: 0,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.4784,
      attributeMultiplier: 2.2176,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
