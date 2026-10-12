import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { ROPE_SPRINT_RECEIVES } from "./receives"
import { ROPE_LIGHT_FIRST_STAGE_HIT } from "./rope-light-attack"

// In-game values as of 2026-10-12.
export const ropeSprintAttack = defineSkill({
  id: SKILL.ropeSprintAttack,
  classId: "bamboocutDust",
  name: "Rope Dart - Sprint Attack",
  tags: [WEAPON.ropeDart, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustRopeSprintAttack,
  receives: ROPE_SPRINT_RECEIVES,
  castFrames: 76,
  triggerable: false,
  hits: [
    hit(0, { frame: 36, ...ROPE_LIGHT_FIRST_STAGE_HIT }),
    hit(1, { frame: 56, ...ROPE_LIGHT_FIRST_STAGE_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
