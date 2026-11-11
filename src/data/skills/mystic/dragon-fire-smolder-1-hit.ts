import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"
import { BRANCH_FORM_MIN_BREAKTHROUGH } from "./branchFormFloor"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"
import {
  QUICK_FORM_HIGHER_PRIORITY_BREAK_FRAME,
  SLOW_FORM_FIRST_HIT_FRAME,
  quickFormFollowUpHit,
  slowFormBreakMarkers,
  slowFormVariant,
} from "../dragonBreathSlowForm"

const ROW = levelScaled(LEVEL_ROWS.dragonFireSmolderStrike)

const BONUS_ROW = levelScaled(LEVEL_ROWS.dragonFireSmolderFinisher)

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
  minBreakthrough: BRANCH_FORM_MIN_BREAKTHROUGH,
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
      // In-game values as of 2026-10-15.
      ...levelScaled(LEVEL_ROWS.dragonFireSmolderStrike),
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
