import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const poet4 = defineSkill({
  id: SKILL.poet4,
  classId: "universal",
  name: "Poet4",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.poet4,
  castFrames: 39,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.0238,
      attributeMultiplier: 1.5357,
      physFixed: 189,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          id: "tg-poet4-combustion-ext",
          target: DEBUFF.combustion,
          stacks: 0,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
