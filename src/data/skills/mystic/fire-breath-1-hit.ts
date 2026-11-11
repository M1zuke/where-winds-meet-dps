import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"
import {
  QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME,
  SLOW_FORM_FIRST_HIT_FRAME,
  quickFormFollowUpHit,
  slowFormBreakMarkers,
  slowFormVariant,
} from "../dragonBreathSlowForm"

const ROW = levelScaled(LEVEL_ROWS.fireBreathStrike)

const BONUS_ROW = levelScaled(LEVEL_ROWS.fireBreathFinisher)

const COMBUSTION_EXTENSION = [
  applyDebuff({ target: DEBUFF.combustion, extendFrames: 90, extendOnly: true }),
]

export const fireBreath1Hit = defineSkill({
  id: SKILL.fireBreath1Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath 1 Hit",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreath1Hit,
  // In-game values as of 2026-11-10: the cast a higher-priority follow-up breaks, one frame
  // after the first hit's own animation frame. Any other follow-up waits for the full
  // animation, so the later hits land too.
  castFrames: QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME,
  triggerable: true,
  receives: WINEBOUND_MYSTIC_RECEIVES,
  // In-game values as of 2026-10-18.
  vitalityCost: 20,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 36,
      ...levelScaled(LEVEL_ROWS.fireBreathStrike),
      triggers: [applyDebuff({ target: DEBUFF.combustion, extendFrames: 90 })],
      variants: [slowFormVariant(SKILL.fireBreath1Hit, 0, ROW, SLOW_FORM_FIRST_HIT_FRAME)],
    }),
    quickFormFollowUpHit(1, 102, ROW, COMBUSTION_EXTENSION),
    quickFormFollowUpHit(2, 108, BONUS_ROW, COMBUSTION_EXTENSION),
    ...slowFormBreakMarkers(3),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
