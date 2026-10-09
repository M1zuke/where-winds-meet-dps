import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

// In-game values as of 2026-10-06 (level 171).
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
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 0.510034,
      attributeMultiplier: 0.765052,
      physFixed: 77.3328,
      attributeFixed: 0,
    }),
    hit(1, {
      frame: 68,
      physMultiplier: 3.060207,
      attributeMultiplier: 4.59031,
      physFixed: 463.997,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.toadPoisonFury })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
