import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { ROPE_DASH_RECEIVES } from "./receives"
import { ROPE_LIGHT_FIRST_STAGE_HIT } from "./rope-light-attack"

// In-game values as of 2026-10-12.
export const ropeDash = defineSkill({
  id: SKILL.ropeDash,
  classId: "bamboocutDust",
  name: "Rope Dart - Dash",
  tags: [WEAPON.ropeDart],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustRopeDash,
  receives: ROPE_DASH_RECEIVES,
  castFrames: 62,
  triggerable: false,
  hits: [
    hit(0, { frame: 36, ...ROPE_LIGHT_FIRST_STAGE_HIT }),
    hit(1, { frame: 56, ...ROPE_LIGHT_FIRST_STAGE_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
