import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const poet1 = defineSkill({
  id: SKILL.poet1,
  classId: "universal",
  name: "Poet1",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.poet1,
  castFrames: 29,
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
          id: "tg-poet1-combustion-ext",
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
