import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

// In-game values as of 2026-10-15 (level 176).
export const toadFury = defineSkill({
  id: SKILL.toadFury,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Leaping Toad - Fury",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadFury,
  cancelledBy: "deflectCancel",
  castFrames: 96,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 25,
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 0.510072,
      attributeMultiplier: 0.765108,
      physFixed: 80.8234,
      attributeFixed: 0,
    }),
    hit(1, {
      frame: 68,
      physMultiplier: 3.060433,
      attributeMultiplier: 4.59065,
      physFixed: 484.9404,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.toadPoisonFury })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
