import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingslideReslidePrepull = defineSkill({
  id: SKILL.snowpartingslideReslidePrepull,
  classId: "stonesplitStrength",
  name: "SnowpartingSlide Re-slide Prepull",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSlideReslidePrepull,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [BUFF.jadeware],
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-10-15: 8 m approach reach, plus a further
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
  createdAt: "2026-10-16T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
