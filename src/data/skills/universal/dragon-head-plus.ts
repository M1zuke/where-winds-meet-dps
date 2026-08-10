import { defineSkill, hit } from "../define"
import { CAST, MYSTIC, PROP, ROLE } from "../ids"
import { SKILL } from "./ids"

export const dragonHeadPlus = defineSkill({
  id: SKILL.dragonHeadPlus,
  classId: "universal",
  name: "Dragon Head - Plus",
  tags: [MYSTIC.burst, PROP.hasQiBreakDoubleDamage, ROLE.dragonHeadPlus, ROLE.dragonHead],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonHeadPlus,
  guaranteedPrecision: true,
  castFrames: 246,
  triggerable: true,
  hits: [
    hit(0, { frame: 246, physMultiplier: 17.3793, attributeMultiplier: 26.0689, physFixed: 3237, attributeFixed: 0 }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})
