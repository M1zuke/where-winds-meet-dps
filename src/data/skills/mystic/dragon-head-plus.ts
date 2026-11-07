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
  // In-game values as of 2026-10-18.
  vitalityCost: 80,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 246,
      // In-game values as of 2026-10-15.
      physMultiplier: 12.597266,
      attributeMultiplier: 18.895899,
      physFixed: 1999.4721,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
