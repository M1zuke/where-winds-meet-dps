import { hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"

// Every frame below is press-relative: the 31 f minimum hold to reach stage 1
// (a charge node that starts at 12.6 f plus 0.3 s of charge, rounded up), the
// same reference the drain and freeze below already use, plus each collider's
// own frame after release — in-game values as of 2026-10-06.
export const SWORD_CHARGE_STAGE_1_HITS: SkillHit[] = [
  hit(0, {
    frame: 37,
    ...levelScaled(LEVEL_ROWS.swordChargeStage11HitHit0),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 61,
    ...levelScaled(LEVEL_ROWS.swordChargeStage12HitHit1),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 71,
    ...levelScaled(LEVEL_ROWS.swordChargeStage12HitHit1),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 81,
    ...levelScaled(LEVEL_ROWS.swordChargeStage12HitHit1),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 139,
    ...levelScaled(LEVEL_ROWS.swordChargeStage15HitHit4),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]
