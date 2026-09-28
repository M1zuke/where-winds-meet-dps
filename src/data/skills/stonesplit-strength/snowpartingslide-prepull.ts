import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingslidePrepull = defineSkill({
  id: SKILL.snowpartingslidePrepull,
  classId: "stonesplitStrength",
  name: "SnowpartingSlide Prepull",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSlidePrepull,
  receives: SNOWPARTING_BLADE_RECEIVES,
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-09-28: 8 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 8,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
