import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { BRANCH_FORM_MIN_BREAKTHROUGH } from "./branchFormFloor"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"

// The caster is hit during the flip.
export const toadFuryHit = defineSkill({
  id: SKILL.toadFuryHit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Leaping Toad - Fury (Hit)",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadFuryHit,
  minBreakthrough: BRANCH_FORM_MIN_BREAKTHROUGH,
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
      ...levelScaled(LEVEL_ROWS.toadFuryStrike),
    }),
    hit(1, {
      frame: 68,
      ...levelScaled(LEVEL_ROWS.toadFuryHitFinisher),
      triggers: [applyDebuff({ target: DEBUFF.toadPoisonFury })],
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
