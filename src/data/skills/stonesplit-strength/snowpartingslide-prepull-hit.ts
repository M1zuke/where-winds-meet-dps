import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingslidePrepullHit = defineSkill({
  id: SKILL.snowpartingslidePrepullHit,
  classId: "stonesplitStrength",
  name: "SnowpartingSlide Prepull[Hit]",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSlidePrepullHit,
  receives: SNOWPARTING_BLADE_RECEIVES,
  castFrames: 6,
  triggerable: true,
  // In-game values as of 2026-09-28: 8 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 8,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.2338,
      attributeMultiplier: 1.8507,
      physFixed: 342,
      attributeFixed: 186,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
