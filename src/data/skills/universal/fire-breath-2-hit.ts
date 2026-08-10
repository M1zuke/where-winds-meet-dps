import { defineSkill, hit } from "../define"
import { applyDebuff } from "../triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fireBreath2Hit = defineSkill({
  id: SKILL.fireBreath2Hit,
  classId: "universal",
  name: "Dragon's Breath 2 Hits",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath2Hits,
  castFrames: 100,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 1.4081666666666666,
      attributeMultiplier: 2.11225,
      physFixed: 262.6666666666667,
      attributeFixed: 0,
      triggers: [applyDebuff({ id: "tg-fire-breath-2-hit-combustion", target: DEBUFF.combustion, extendFrames: 90 })],
    }),
    hit(1, {
      frame: 70,
      physMultiplier: 1.4081666666666666,
      attributeMultiplier: 2.11225,
      physFixed: 262.6666666666667,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          id: "tg-fire-breath-2-hit-combustion-ext-0",
          target: DEBUFF.combustion,
          extendFrames: 60,
          extendOnly: true,
        }),
      ],
    }),
    hit(2, {
      frame: 100,
      physMultiplier: 1.4081666666666666,
      attributeMultiplier: 2.11225,
      physFixed: 262.6666666666667,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          id: "tg-fire-breath-2-hit-combustion-ext-1",
          target: DEBUFF.combustion,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
