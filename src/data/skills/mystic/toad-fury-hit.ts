import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

// In-game values as of 2026-10-06 (level 171), with the caster hit during the
// flip.
export const toadFuryHit = defineSkill({
  id: SKILL.toadFuryHit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Leaping Toad - Fury (Hit)",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadFuryHit,
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
      physMultiplier: 3.978269,
      attributeMultiplier: 5.967404,
      physFixed: 603.1961,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.toadPoisonFury })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
