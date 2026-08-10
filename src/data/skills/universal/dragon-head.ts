import { defineSkill, hit } from "../define"
import { CAST, MYSTIC, ROLE } from "../ids"
import { SKILL } from "./ids"

export const dragonHead = defineSkill({
  id: SKILL.dragonHead,
  classId: "universal",
  name: "Dragon Head",
  tags: [MYSTIC.burst, ROLE.dragonHead],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonHead,
  guaranteedNormal: true,
  castFrames: 246,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 246,
      physMultiplier: 24.827571,
      attributeMultiplier: 37.241286,
      physFixed: 4624.285714,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})
