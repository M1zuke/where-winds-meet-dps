import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fireBreath1Hit = defineSkill({
  id: SKILL.fireBreath1Hit,
  classId: "universal",
  name: "Dragon's Breath 1 Hit",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath1Hit,
  castFrames: 40,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 1.36185,
      attributeMultiplier: 2.042775,
      physFixed: 254,
      attributeFixed: 0,
      triggers: [applyDebuff({ id: "tg-fire-breath-1-hit-combustion", target: DEBUFF.combustion, extendFrames: 90 })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
