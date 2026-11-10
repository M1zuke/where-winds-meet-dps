import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import {
  QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME,
  SLOW_FORM_FIRST_HIT_FRAME,
  quickFormFollowUpHit,
  slowFormBreakMarkers,
  slowFormVariant,
} from "../dragonBreathSlowForm"

const ROW = {
  physMultiplier: 1.283899,
  attributeMultiplier: 1.925849,
  physFixed: 204.9587,
  attributeFixed: 0,
}

const BONUS_ROW = {
  physMultiplier: 1.41491,
  attributeMultiplier: 2.122364,
  physFixed: 225.8728,
  attributeFixed: 0,
}

const SMOLDER_EXTENSION = [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })]

export const dragonFireSmolder1Hit = defineSkill({
  id: SKILL.dragonFireSmolder1Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath: Smolder 1 Hit",
  breakdownName: "Dragon's Breath",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreathSmolder1Hit,
  // In-game values as of 2026-11-10: the cast a higher-priority follow-up breaks, one frame
  // after the first hit's own animation frame. Any other follow-up waits for the full
  // animation, so the later hits land too.
  castFrames: QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 20,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 36,
      // In-game values as of 2026-10-15.
      physMultiplier: 1.283899,
      attributeMultiplier: 1.925849,
      physFixed: 204.9587,
      attributeFixed: 0,
      triggers: SMOLDER_EXTENSION,
      variants: [slowFormVariant(SKILL.dragonFireSmolder1Hit, 0, ROW, SLOW_FORM_FIRST_HIT_FRAME)],
    }),
    quickFormFollowUpHit(1, 102, ROW, SMOLDER_EXTENSION),
    quickFormFollowUpHit(2, 108, BONUS_ROW, SMOLDER_EXTENSION),
    ...slowFormBreakMarkers(3),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
