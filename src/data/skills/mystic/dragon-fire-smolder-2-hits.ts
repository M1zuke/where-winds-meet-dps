import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"
import { BRANCH_FORM_MIN_BREAKTHROUGH } from "./branchFormFloor"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"
import {
  SLOW_FORM_BONUS_FRAME,
  SLOW_FORM_FIRST_HIT_FRAME,
  SLOW_FORM_FULL_CAST_FRAMES,
  SLOW_FORM_SECOND_HIT_FRAME,
  slowFormOpensIntoxicated,
  slowFormVariant,
} from "../dragonBreathSlowForm"

const ROW = levelScaled(LEVEL_ROWS.dragonFireSmolderStrike)

const BONUS_ROW = levelScaled(LEVEL_ROWS.dragonFireSmolderFinisher)

export const dragonFireSmolder2Hits = defineSkill({
  id: SKILL.dragonFireSmolder2Hits,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath: Smolder 2 Hits",
  breakdownName: "Dragon's Breath",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreathSmolder2Hits,
  minBreakthrough: BRANCH_FORM_MIN_BREAKTHROUGH,
  // Hit frames: in-game animation, 2026-09-09. castFrames is not margin-derived — see
  // dragon-fire-smolder-1-hit.ts.
  castFrames: 137,
  triggerable: true,
  receives: WINEBOUND_MYSTIC_RECEIVES,
  // In-game values as of 2026-10-18.
  vitalityCost: 20,
  // In-game values as of 2026-09-28: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  // In-game values as of 2026-10-15.
  hits: [
    hit(0, {
      frame: 36,
      ...levelScaled(LEVEL_ROWS.dragonFireSmolderStrike),
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
      variants: [
        slowFormVariant(
          SKILL.dragonFireSmolder2Hits,
          0,
          ROW,
          SLOW_FORM_FIRST_HIT_FRAME,
          SLOW_FORM_FULL_CAST_FRAMES,
        ),
      ],
    }),
    hit(1, {
      frame: 102,
      ...levelScaled(LEVEL_ROWS.dragonFireSmolderStrike),
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
      variants: [slowFormVariant(SKILL.dragonFireSmolder2Hits, 1, ROW, SLOW_FORM_SECOND_HIT_FRAME)],
    }),
    hit(2, {
      frame: 108,
      ...BONUS_ROW,
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
      variants: [
        slowFormVariant(SKILL.dragonFireSmolder2Hits, 2, BONUS_ROW, SLOW_FORM_BONUS_FRAME),
      ],
    }),
    slowFormOpensIntoxicated(3),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
