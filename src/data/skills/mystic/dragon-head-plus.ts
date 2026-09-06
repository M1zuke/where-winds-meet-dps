import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC, PROP, ROLE } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const dragonHeadPlus = defineSkill({
  id: SKILL.dragonHeadPlus,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon Head - Plus",
  tags: [MYSTIC.burst, PROP.hasQiBreakDoubleDamage, ROLE.dragonHeadPlus, ROLE.dragonHead],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonHeadPlus,
  receives: [BUFF.surgingWaves, BUFF.dragonHeadLowHp],
  triggersBuffs: [BUFF.surgingWaves],
  neverAbrades: true,
  castFrames: 246,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 246,
      physMultiplier: 17.3793,
      attributeMultiplier: 26.0689,
      physFixed: 3237,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
