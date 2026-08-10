import { defineSkill, hit } from "../define"
import { applyDebuff } from "../triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fireBreath1HitPrepull = defineSkill({
  id: SKILL.fireBreath1HitPrepull,
  classId: "universal",
  name: "Dragon's Breath 1 Hit Prepull",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath1HitPrepull,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.36185,
      attributeMultiplier: 2.042775,
      physFixed: 254,
      attributeFixed: 0,
      triggers: [
        applyDebuff({ id: "tg-fire-breath-1-hit-prepull-combustion", target: DEBUFF.combustion, extendFrames: 90 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
