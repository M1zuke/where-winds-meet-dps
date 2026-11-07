import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fireBreath1HitPrepull = defineSkill({
  id: SKILL.fireBreath1HitPrepull,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath 1 Hit Prepull",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath1HitPrepull,
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 20,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  // In-game values as of 2026-10-15, level 76.
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.360884,
      attributeMultiplier: 2.041327,
      physFixed: 215.2962,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.combustion, extendFrames: 90 })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
