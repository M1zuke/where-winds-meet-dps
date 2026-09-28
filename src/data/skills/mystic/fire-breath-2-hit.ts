import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fireBreath2Hit = defineSkill({
  id: SKILL.fireBreath2Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath 2 Hits",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath2Hits,
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-09-24.
  castFrames: 137,
  triggerable: true,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.combustion, extendFrames: 90 })],
    }),
    hit(1, {
      frame: 102,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          target: DEBUFF.combustion,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
    }),
    hit(2, {
      frame: 108,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          target: DEBUFF.combustion,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
